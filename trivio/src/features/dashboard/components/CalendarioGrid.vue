<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import type { ManutencaoAPI } from '@/shared/services/manutencaoService'
import type { DiaDaSemana } from '@/features/dashboard/composables/useCalendario'
import { GRID_START_HOUR, GRID_END_HOUR, ROW_HEIGHT_PX } from '@/features/dashboard/composables/useCalendario'
import CalendarioCard from './CalendarioCard.vue'
import CalendarioBanner from './CalendarioBanner.vue'
import CalendarioContextMenu from './CalendarioContextMenu.vue'

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

function getHourMinute(iso: string): { h: number; m: number } {
  const d = new Date(iso)
  return { h: d.getHours(), m: d.getMinutes() }
}

function computeCardLayouts(ms: ManutencaoAPI[]): CardLayout[] {
  const timed = ms.filter(m => m.startTime && m.endTime)
  if (!timed.length) return []

  const sorted = [...timed].sort((a, b) =>
    new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
  )

  interface Slot { manutencao: ManutencaoAPI; col: number; totalCols: number }
  const slots: Slot[] = sorted.map(m => ({ manutencao: m, col: 0, totalCols: 1 }))

  const processed = new Set<number>()
  for (let i = 0; i < slots.length; i++) {
    if (processed.has(i)) continue
    const group: number[] = [i]
    let groupMaxEnd = new Date(slots[i]!.manutencao.endTime!).getTime()
    for (let j = i + 1; j < slots.length; j++) {
      const bStart = new Date(slots[j]!.manutencao.startTime!).getTime()
      if (bStart < groupMaxEnd) {
        group.push(j)
        groupMaxEnd = Math.max(groupMaxEnd, new Date(slots[j]!.manutencao.endTime!).getTime())
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
</script>

<template>
  <div class="cal-grid-root">
    <div class="cal-header-row">
      <div class="cal-corner" />
      <div class="cal-days-wrap">
        <div
          v-for="dia in dias"
          :key="dia.dateStr"
          class="cal-day-header"
          :class="{ 'cal-day-header--today': dia.isToday }"
        >
          <span class="cal-day-label">{{ dia.label }}</span>
          <span class="cal-day-num">{{ dia.date.getDate() }}</span>
        </div>
      </div>
      <div class="cal-scrollbar-spacer" :style="{ width: scrollbarWidth + 'px' }" />
    </div>

    <CalendarioBanner
      :dias="dias"
      :manutencoes="untimedMs"
      :scrollbar-width="scrollbarWidth"
      @card-click="emit('card-click', $event)"
    />

    <CalendarioContextMenu
      @nova-manutencao="onContextNovaManutencao"
      @ir-para-hoje="onContextIrParaHoje"
    >
      <div class="cal-scroll-area">
        <div class="cal-time-grid" :style="{ height: `${gridHeightPx}px` }">
          <!-- Hour labels -->
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
            >
              <div
                v-for="h in hours"
                :key="h"
                class="cal-hour-row"
                :style="{ top: `${(h - GRID_START_HOUR) * ROW_HEIGHT_PX}px`, height: `${ROW_HEIGHT_PX}px`, borderTop: h === GRID_START_HOUR ? 'none' : undefined }"
                @click="onCellClick(dia.dateStr, h)"
                @contextmenu="ctxHour = h"
              >
                <div class="cal-hover-plus">
                  <Plus :size="14" class="cal-plus-icon" />
                </div>
              </div>

              <CalendarioCard
                v-for="layout in cardsByDay[di] ?? []"
                :key="layout.manutencao.id"
                :manutencao="layout.manutencao"
                :top-px="layout.topPx"
                :height-px="layout.heightPx"
                :left-percent="layout.leftPercent"
                :width-percent="layout.widthPercent"
                @click="emit('card-click', $event)"
                @expand="emit('card-expand', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </CalendarioContextMenu>
  </div>
</template>

<style scoped>
.cal-grid-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--nd-border-visible);
  border-radius: 6px;
}

.cal-header-row {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid var(--nd-border-visible);
  background: var(--nd-surface);
}
.cal-corner { width: 48px; flex-shrink: 0; border-right: 1px solid var(--nd-border); }
.cal-days-wrap {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.cal-scrollbar-spacer {
  flex-shrink: 0;
  border-left: 1px solid var(--nd-border);
  background: var(--nd-surface);
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

.cal-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.cal-time-grid {
  display: flex;
  position: relative;
}

.cal-hour-labels {
  width: 48px;
  flex-shrink: 0;
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
