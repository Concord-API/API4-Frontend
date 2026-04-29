<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ManutencaoAPI, ManutencaoStatus } from '@/shared/services/manutencaoService'
import type { DiaDaSemana } from '@/features/dashboard/composables/useCalendario'
import { Popover, PopoverContent, PopoverAnchor } from '@/shared/components/ui/popover'
import CalendarioPopover from './CalendarioPopover.vue'

const props = defineProps<{
  dias: DiaDaSemana[]
  manutencoes: ManutencaoAPI[]
  scrollbarWidth: number
  isTechnician?: boolean
}>()

const emit = defineEmits<{
  'card-expand': [manutencao: ManutencaoAPI]
  'drag-start': [event: DragEvent, manutencao: ManutencaoAPI]
  'drag-end': []
  'banner-drop': [id: number, dateStr: string]
}>()

function statusColor(m: ManutencaoAPI): string {
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const d = new Date(m.date); d.setHours(0,0,0,0)
  if (m.status === 'SCHEDULED' && d < hoje) return 'var(--nd-accent)'
  const map: Record<ManutencaoStatus, string> = {
    SCHEDULED: 'var(--nd-action)',
    STARTED: 'var(--nd-warning)',
    COMPLETED: 'var(--nd-success)',
  }
  return map[m.status]
}

const porDia = computed(() =>
  props.dias.map(dia =>
    props.manutencoes.filter(m => m.date === dia.dateStr)
  )
)

const openPopovers = ref<Record<number, boolean>>({})

function onChipExpand(m: ManutencaoAPI) {
  emit('card-expand', m)
}

function onChipDragStart(e: DragEvent, m: ManutencaoAPI) {
  if (props.isTechnician) return
  openPopovers.value[m.id] = false
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(m.id))
  }
  emit('drag-start', e, m)
}

function onColDrop(e: DragEvent, dateStr: string) {
  if (props.isTechnician) return
  e.preventDefault()
  const id = Number(e.dataTransfer?.getData('text/plain'))
  if (!id) return
  emit('banner-drop', id, dateStr)
}
</script>

<template>
  <div class="cal-banner">
    <div class="cal-banner-label">sem horário</div>
    <div class="cal-banner-cols">
      <div
        v-for="(ms, i) in porDia"
        :key="i"
        class="cal-banner-col"
        @dragover.prevent
        @drop="onColDrop($event, dias[i]!.dateStr)"
      >
        <Popover
          v-for="m in ms"
          :key="m.id"
          :open="!!openPopovers[m.id]"
          @update:open="(v) => (openPopovers[m.id] = v)"
        >
          <PopoverAnchor as-child>
            <div
              class="cal-banner-chip"
              :style="{ '--chip-color': statusColor(m) }"
              :title="m.contract?.client?.name ?? m.type"
              :draggable="!isTechnician"
              @dragstart="onChipDragStart($event, m)"
              @dragend="emit('drag-end')"
              @click.stop="openPopovers[m.id] = !openPopovers[m.id]"
              @dblclick.stop="onChipExpand(m)"
            >
              {{ m.contract?.client?.name ?? m.type }}
            </div>
          </PopoverAnchor>
          <PopoverContent
            side="bottom"
            :side-offset="4"
            align="start"
            class="cpv-popover-content"
          >
            <CalendarioPopover
              :manutencao="m"
              @expand="onChipExpand"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cal-banner {
  display: flex;
  border-bottom: 1px solid var(--nd-border-visible);
  background: inherit;
  min-height: 28px;
}

.cal-banner-label {
  width: 48px;
  flex-shrink: 0;
  font-family: 'Montserrat', sans-serif;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--nd-text-disabled);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  text-align: right;
  padding-right: 6px;
  padding-top: 4px;
  padding-bottom: 4px;
  border-right: 1px solid var(--nd-border);
  box-sizing: border-box;
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--nd-surface);
}
:root.dark .cal-banner-label,
.dark .cal-banner-label {
  background: var(--nd-bg);
}

.cal-banner-cols {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.cal-banner-col {
  border-right: 1px solid var(--nd-border);
  padding: 3px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 32px;
}
.cal-banner-col:last-child { border-right: none; }

.cal-banner-chip {
  display: flex;
  align-items: center;
  background: color-mix(in srgb, var(--chip-color) 13%, transparent);
  border-left: 2px solid var(--chip-color);
  color: var(--chip-color);
  font-family: 'Montserrat', sans-serif;
  font-size: 9px;
  font-weight: 600;
  padding: 0 4px;
  height: 24px;
  border-radius: 0 2px 2px 0;
  cursor: grab;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  transition: filter 100ms ease-out;
  box-sizing: border-box;
}
.cal-banner-chip:active { cursor: grabbing; }
.cal-banner-chip:hover { filter: brightness(1.15); }


.cpv-popover-content {
  padding: 12px !important;
  width: auto !important;
  max-width: 300px !important;
  border: 1px solid var(--nd-border-visible) !important;
  background: var(--nd-surface) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25) !important;
}
</style>
