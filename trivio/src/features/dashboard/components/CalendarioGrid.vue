<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { manutencaoService, type ManutencaoAPI } from '@/shared/services/manutencaoService'
import type { DiaDaSemana } from '@/features/dashboard/composables/useCalendario'
import { GRID_START_HOUR, GRID_END_HOUR, ROW_HEIGHT_PX } from '@/features/dashboard/composables/useCalendario'
import CalendarioCard from './CalendarioCard.vue'
import CalendarioBanner from './CalendarioBanner.vue'
import CalendarioContextMenu from './CalendarioContextMenu.vue'
import { useAuth } from '@/shared/composables/useAuth'

const { currentUser } = useAuth()
const isTechnician = computed(() => String(currentUser.value?.role ?? '').toLowerCase() === 'technician')

const props = defineProps<{
  dias: DiaDaSemana[]
  manutencoes: ManutencaoAPI[]
}>()

const emit = defineEmits<{
  'card-click': [manutencao: ManutencaoAPI]
  'card-expand': [manutencao: ManutencaoAPI]
  'cell-click': [dateStr: string, hour: number]
  'nova-manutencao-ctx': [dateStr: string, hour: number]
  'ir-para-hoje': []
  'saved': []
}>()

const scrollbarWidth = ref(16)

onMounted(() => {
  const outer = document.createElement('div')
  outer.style.visibility = 'hidden'
  outer.style.overflow = 'scroll'
  document.body.appendChild(outer)
  const inner = document.createElement('div')
  outer.appendChild(inner)
  scrollbarWidth.value = outer.offsetWidth - inner.offsetWidth
  outer.parentNode?.removeChild(outer)
})

const hours = computed(() => {
  const result: number[] = []
  for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) result.push(h)
  return result
})

const gridHeightPx = computed(() => (GRID_END_HOUR - GRID_START_HOUR + 1) * ROW_HEIGHT_PX)

interface CardLayout {
  manutencao: ManutencaoAPI
  topPx: number
  heightPx: number
  leftPercent: number
  widthPercent: number
}

function getHourMinute(timeStr: string): { h: number; m: number } {
  if (!timeStr) return { h: 0, m: 0 }
  const [h, m] = timeStr.split(':').map(Number)
  return { h: h || 0, m: m || 0 }
}

function computeCardLayouts(ms: ManutencaoAPI[]): CardLayout[] {
  const timed = ms.filter(m => m.startTime && m.endTime)
  if (!timed.length) return []

  const sorted = [...timed].sort((a, b) => {
    const startA = getHourMinute(a.startTime!)
    const startB = getHourMinute(b.startTime!)
    return (startA.h * 60 + startA.m) - (startB.h * 60 + startB.m)
  })

  interface Slot { manutencao: ManutencaoAPI; col: number; totalCols: number }
  const slots: Slot[] = sorted.map(m => ({ manutencao: m, col: 0, totalCols: 1 }))

  const processed = new Set<number>()
  for (let i = 0; i < slots.length; i++) {
    if (processed.has(i)) continue
    const group: number[] = [i]
    let groupMaxEndMinutes = (() => {
      const end = getHourMinute(slots[i]!.manutencao.endTime!)
      return end.h * 60 + end.m
    })()

    for (let j = i + 1; j < slots.length; j++) {
      const bStart = getHourMinute(slots[j]!.manutencao.startTime!)
      const bStartMinutes = bStart.h * 60 + bStart.m
      
      if (bStartMinutes < groupMaxEndMinutes) {
        group.push(j)
        const bEnd = getHourMinute(slots[j]!.manutencao.endTime!)
        groupMaxEndMinutes = Math.max(groupMaxEndMinutes, bEnd.h * 60 + bEnd.m)
      }
    }
    group.forEach((idx, pos) => {
      slots[idx]!.col = pos
      slots[idx]!.totalCols = group.length
      processed.add(idx)
    })
  }

  return slots.map(({ manutencao, col, totalCols }) => {
    const start = getHourMinute(manutencao.startTime!)
    const end = getHourMinute(manutencao.endTime!)
    const startFraction = (start.h - GRID_START_HOUR) + start.m / 60
    const endFraction = (end.h - GRID_START_HOUR) + end.m / 60
    return {
      manutencao,
      topPx: startFraction * ROW_HEIGHT_PX,
      heightPx: Math.max((endFraction - startFraction) * ROW_HEIGHT_PX, ROW_HEIGHT_PX * 0.5),
      leftPercent: (col / totalCols) * 100,
      widthPercent: 100 / totalCols,
    }
  })
}

const cardsByDay = computed(() =>
  props.dias.map(dia => {
    const dayMs = props.manutencoes.filter(m => m.date === dia.dateStr && m.startTime && m.endTime)
    return computeCardLayouts(dayMs)
  })
)

const untimedMs = computed(() => props.manutencoes.filter(m => !m.startTime || !m.endTime))

const ctxDateStr = ref('')
const ctxHour = ref(0)

function onCellClick(dateStr: string, hour: number) {
  emit('cell-click', dateStr, hour)
}

function onContextNovaManutencao() {
  emit('nova-manutencao-ctx', ctxDateStr.value, ctxHour.value)
}

function onContextIrParaHoje() {
  emit('ir-para-hoje')
}

function labelHour(h: number): string {
  return `${String(h).padStart(2,'0')}:00`
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

// ─── DRAG-AND-DROP ──────────────────────────────────────────────────────────
const draggedManutencao = ref<ManutencaoAPI | null>(null)
const dragOverDate      = ref<string | null>(null)
const dragOverTopPx     = ref(0)

function draggedDurationMin(): number {
  const m = draggedManutencao.value
  if (!m) return 60
  if (m.startTime && m.endTime) {
    const s = getHourMinute(m.startTime)
    const e = getHourMinute(m.endTime)
    return (e.h * 60 + e.m) - (s.h * 60 + s.m)
  }
  return 60
}

const dragGhostHeightPx = computed(() => (draggedDurationMin() / 60) * ROW_HEIGHT_PX)
const dragGhostEndTime = computed(() => {
  if (dragOverDate.value == null) return ''
  const startMin = (dragOverTopPx.value / ROW_HEIGHT_PX) * 60
  const endMin = startMin + draggedDurationMin()
  const pad = (n: number) => String(n).padStart(2, '0')
  const startStr = `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`
  const endStr = `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`
  return `${startStr} – ${endStr}`
})

function onDragStart(e: DragEvent, m: ManutencaoAPI) {
  if (isTechnician.value) return
  draggedManutencao.value = m
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(m.id))
  }
}

function onColDragOver(e: DragEvent, dateStr: string, colEl: HTMLElement) {
  if (isTechnician.value || !draggedManutencao.value) return
  e.preventDefault()
  const rect = colEl.getBoundingClientRect()
  const y = e.clientY - rect.top
  const halfHourPx = ROW_HEIGHT_PX / 2
  const snappedMinutes = Math.round(y / halfHourPx) * 30
  const durationMin = draggedDurationMin()
  const clampedStart = Math.max(0, Math.min(24 * 60 - durationMin, snappedMinutes))
  dragOverDate.value = dateStr
  dragOverTopPx.value = (clampedStart / 60) * ROW_HEIGHT_PX
}

function onColDragLeave(e: DragEvent, colEl: HTMLElement) {
  const related = e.relatedTarget as Node | null
  if (related && colEl.contains(related)) return
  if (dragOverDate.value != null) dragOverDate.value = null
}

function onDragEnd() {
  draggedManutencao.value = null
  dragOverDate.value = null
}

async function onDrop(e: DragEvent, dateStr: string, colEl: HTMLElement) {
  if (isTechnician.value) return
  e.preventDefault()
  if (!draggedManutencao.value) return
  const m = draggedManutencao.value
  draggedManutencao.value = null
  dragOverDate.value = null

  const rect = colEl.getBoundingClientRect()
  const y = e.clientY - rect.top
  const halfHourPx = ROW_HEIGHT_PX / 2

  // snap to 30-min intervals
  const snappedMinutes = Math.round(y / halfHourPx) * 30

  const start = m.startTime ? getHourMinute(m.startTime) : null
  const end   = m.endTime   ? getHourMinute(m.endTime)   : null
  const durationMinutes = (start && end)
    ? (end.h * 60 + end.m) - (start.h * 60 + start.m)
    : 60

  const clampedStart  = Math.max(0, Math.min(24 * 60 - durationMinutes, snappedMinutes))
  const clampedEnd    = clampedStart + durationMinutes

  const pad = (n: number) => String(n).padStart(2, '0')
  const startTime = `${pad(Math.floor(clampedStart / 60))}:${pad(clampedStart % 60)}`
  const endTime   = `${pad(Math.floor(clampedEnd   / 60))}:${pad(clampedEnd   % 60)}`

  try {
    await manutencaoService.atualizar(m.id, {
      contractId: m.contract.id,
      date: dateStr,
      preventive: m.type === 'PREVENTIVA',
      type: m.type,
      status: m.status,
      employeeIds: m.employees.map(emp => emp.employeeId),
      startTime,
      endTime,
      ...(m.latitude != null && m.longitude != null ? { latitude: m.latitude, longitude: m.longitude } : {}),
    })
    toast.success('Manutenção movida.')
    emit('saved')
  } catch {
    toast.error('Erro ao mover a manutenção.')
  }
}

async function onBannerDrop(id: number, dateStr: string) {
  if (isTechnician.value) return
  const m = props.manutencoes.find(x => x.id === id)
  if (!m) return
  if (m.date === dateStr && !m.startTime && !m.endTime) return

  try {
    await manutencaoService.atualizar(m.id, {
      contractId: m.contract.id,
      date: dateStr,
      preventive: m.type === 'PREVENTIVA',
      type: m.type,
      status: m.status,
      employeeIds: m.employees.map(emp => emp.employeeId),
      startTime: '',
      endTime: '',
      ...(m.latitude != null && m.longitude != null ? { latitude: m.latitude, longitude: m.longitude } : {}),
    })
    toast.success('Manutenção movida para sem horário.')
    emit('saved')
  } catch {
    toast.error('Erro ao mover a manutenção.')
  }
}

// ─── RESIZE ──────────────────────────────────────────────────────────────────
const resizingManutencao  = ref<ManutencaoAPI | null>(null)
const resizeStartY        = ref(0)
const resizeStartEndMin   = ref(0)
const resizePreviewEndMin = ref<number | null>(null)

function onResizeStart(e: MouseEvent, m: ManutencaoAPI) {
  if (isTechnician.value) return
  resizingManutencao.value = m
  resizeStartY.value = e.clientY
  const end = getHourMinute(m.endTime!)
  resizeStartEndMin.value = end.h * 60 + end.m
  resizePreviewEndMin.value = resizeStartEndMin.value

  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(e: MouseEvent) {
  if (!resizingManutencao.value) return
  const m = resizingManutencao.value
  const deltaY = e.clientY - resizeStartY.value
  const halfHourPx = ROW_HEIGHT_PX / 2
  const deltaMinutes = Math.round(deltaY / halfHourPx) * 30
  const start = getHourMinute(m.startTime!)
  const startMinutes = start.h * 60 + start.m
  resizePreviewEndMin.value = Math.max(startMinutes + 30, Math.min(24 * 60 - 1, resizeStartEndMin.value + deltaMinutes))
}

async function onResizeEnd(_e: MouseEvent) {
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)

  if (!resizingManutencao.value) return
  const m = resizingManutencao.value
  const newEndMin = resizePreviewEndMin.value!

  resizingManutencao.value = null
  resizePreviewEndMin.value = null

  const start = getHourMinute(m.startTime!)
  const startMinutes = start.h * 60 + start.m
  if (newEndMin === resizeStartEndMin.value) return
  if (newEndMin <= startMinutes) return

  const pad = (n: number) => String(n).padStart(2, '0')
  const endTime = `${pad(Math.floor(newEndMin / 60))}:${pad(newEndMin % 60)}`

  try {
    await manutencaoService.atualizar(m.id, {
      contractId: m.contract.id,
      date: m.date,
      preventive: m.type === 'PREVENTIVA',
      type: m.type,
      status: m.status,
      employeeIds: m.employees.map(emp => emp.employeeId),
      startTime: m.startTime,
      endTime,
      ...(m.latitude != null && m.longitude != null ? { latitude: m.latitude, longitude: m.longitude } : {}),
    })
    toast.success('Duração atualizada.')
    emit('saved')
  } catch {
    toast.error('Erro ao redimensionar.')
  }
}

function resizePreviewFor(id: number): { heightPx: number; endTime: string } | null {
  if (resizingManutencao.value?.id !== id || resizePreviewEndMin.value == null) return null
  const m = resizingManutencao.value
  const start = getHourMinute(m.startTime!)
  const startMin = start.h * 60 + start.m
  const durationMin = resizePreviewEndMin.value - startMin
  const heightPx = (durationMin / 60) * ROW_HEIGHT_PX
  const pad = (n: number) => String(n).padStart(2, '0')
  const endTime = `${pad(Math.floor(resizePreviewEndMin.value / 60))}:${pad(resizePreviewEndMin.value % 60)}`
  return { heightPx, endTime }
}
</script>

<template>
  <div class="cal-grid-root">
    <div class="cal-grid-inner">
      <div class="cal-header-row">
        <div class="cal-corner" aria-hidden="true"></div>
        <div class="cal-days-wrap">
          <div
            v-for="dia in dias"
            :key="dia.dateStr"
            class="cal-day-header"
            :class="{ 'cal-day-header--today': isToday(dia.dateStr) }"
          >
            <span class="cal-day-label">{{ dia.label }}</span>
            <span class="cal-day-num">{{ dia.date.getDate() }}</span>
          </div>
        </div>

      </div>

      <CalendarioContextMenu
        :is-technician="isTechnician"
        @nova-manutencao="onContextNovaManutencao"
        @ir-para-hoje="onContextIrParaHoje"
      >
        <div class="cal-ctx-wrap">
          <CalendarioBanner
            :dias="dias"
            :manutencoes="untimedMs"
            :scrollbar-width="scrollbarWidth"
            :is-technician="isTechnician"
            @card-expand="emit('card-expand', $event)"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
            @banner-drop="onBannerDrop"
          />

          <div class="cal-scroll-area">
            <div class="cal-time-grid" :style="{ height: `${gridHeightPx}px` }">
              <div class="cal-hour-labels">
                <div
                  v-for="h in hours"
                  :key="h"
                  class="cal-hour-label"
                >
                  {{ labelHour(h) }}
                </div>
              </div>

              <div class="cal-days-cols">
                <div
                  v-for="(dia, di) in dias"
                  :key="dia.dateStr"
                  class="cal-day-col"
                  @contextmenu="ctxDateStr = dia.dateStr"
                  @dragover="onColDragOver($event, dia.dateStr, $event.currentTarget as HTMLElement)"
                  @dragleave="onColDragLeave($event, $event.currentTarget as HTMLElement)"
                  @drop="onDrop($event, dia.dateStr, $event.currentTarget as HTMLElement)"
                >
                  <div
                    v-for="h in hours"
                    :key="h"
                    class="cal-hour-row"
                    :style="{ top: `${(h - GRID_START_HOUR) * ROW_HEIGHT_PX}px`, height: `${ROW_HEIGHT_PX}px`, borderTop: h === GRID_START_HOUR ? 'none' : undefined, cursor: isTechnician ? 'default' : 'pointer' }"
                    @click="!isTechnician && onCellClick(dia.dateStr, h)"
                    @contextmenu="!isTechnician && (ctxHour = h)"
                  >
                    <div v-if="!isTechnician" class="cal-hover-plus">
                      <Plus :size="14" class="cal-plus-icon" />
                    </div>
                  </div>

                  <CalendarioCard
                    v-for="layout in cardsByDay[di] ?? []"
                    :key="layout.manutencao.id"
                    :manutencao="layout.manutencao"
                    :top-px="layout.topPx"
                    :height-px="resizePreviewFor(layout.manutencao.id)?.heightPx ?? layout.heightPx"
                    :left-percent="layout.leftPercent"
                    :width-percent="layout.widthPercent"
                    :is-technician="isTechnician"
                    :preview-end-time="resizePreviewFor(layout.manutencao.id)?.endTime"
                    @click="emit('card-click', $event)"
                    @expand="emit('card-expand', $event)"
                    @drag-start="onDragStart"
                    @drag-end="onDragEnd"
                    @resize-start="onResizeStart"
                  />

                  <div
                    v-if="dragOverDate === dia.dateStr"
                    class="cal-drag-ghost"
                    :style="{ top: `${dragOverTopPx}px`, height: `${dragGhostHeightPx}px` }"
                  >
                    <span class="cal-drag-ghost-label">{{ dragGhostEndTime }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CalendarioContextMenu>
    </div>
  </div>
</template>

<style scoped>
.cal-grid-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
  border: 1px solid var(--nd-border-visible);
  border-radius: 6px;
  background: var(--nd-surface);
}

.cal-grid-inner {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 600px;
  min-height: max-content;
}

:root.dark .cal-grid-root,
.dark .cal-grid-root {
  background: var(--nd-bg);
}

.cal-header-row {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid var(--nd-border-visible);
  background: var(--nd-surface);
  position: sticky;
  top: 0;
  z-index: 30;
}

:root.dark .cal-header-row,
.dark .cal-header-row {
  background: var(--nd-bg);
}

.cal-corner {
  width: 48px;
  flex-shrink: 0;
  border-right: 1px solid var(--nd-border);
  position: sticky;
  left: 0;
  z-index: 40;
  background: var(--nd-surface);
  display: flex;
  align-items: center;
  justify-content: center;
}
:root.dark .cal-corner,
.dark .cal-corner {
  background: var(--nd-bg);
}

.cal-days-wrap {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.cal-day-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border-right: 1px solid var(--nd-border);
  gap: 2px;
}
.cal-day-header:last-child {
  border-right: none;
}
.cal-day-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--nd-text-secondary);
}
.cal-day-num {
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 400;
  color: var(--nd-text-secondary);
  line-height: 1;
}
.cal-day-header--today .cal-day-label { color: var(--nd-action); }
.cal-day-header--today .cal-day-num { color: var(--nd-action); font-weight: 600; }

.cal-ctx-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.cal-scroll-area {
  flex: 1;
}
.cal-time-grid {
  display: flex;
  position: relative;
}

.cal-hour-labels {
  width: 48px;
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--nd-surface);
}

:root.dark .cal-hour-labels,
.dark .cal-hour-labels {
  background: var(--nd-bg);
}
.cal-hour-label {
  height: 48px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding-right: 6px;
  padding-top: 2px;
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--nd-text-disabled);
  border-right: 1px solid var(--nd-border);
  box-sizing: border-box;
}

.cal-days-cols {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  position: relative;
}
.cal-day-col {
  position: relative;
  border-right: 1px solid var(--nd-border);
}
.cal-day-col:last-child { border-right: none; }

.cal-drag-ghost {
  position: absolute;
  left: 0;
  right: 0;
  background: color-mix(in srgb, var(--nd-action) 18%, transparent);
  border: 1.5px dashed var(--nd-action);
  border-radius: 4px;
  pointer-events: none;
  z-index: 15;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2px;
  box-sizing: border-box;
}
.cal-drag-ghost-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--nd-action);
  background: var(--nd-surface);
  padding: 1px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

.cal-hour-row {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid var(--nd-border);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cal-hour-row:hover .cal-hover-plus { opacity: 1; }

.cal-hover-plus {
  opacity: 0;
  transition: opacity 100ms ease-out;
  pointer-events: none;
}
.cal-plus-icon { color: var(--nd-text-disabled); }
</style>
