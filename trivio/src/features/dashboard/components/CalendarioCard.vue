<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ManutencaoAPI, ManutencaoStatus } from '@/shared/services/manutencaoService'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import CalendarioPopover from './CalendarioPopover.vue'

const props = defineProps<{
  manutencao: ManutencaoAPI
  topPx: number
  heightPx: number
  leftPercent: number
  widthPercent: number
}>()

const emit = defineEmits<{
  click: [manutencao: ManutencaoAPI]
  expand: [manutencao: ManutencaoAPI]
}>()

const popoverOpen = ref(false)

const hoje = new Date()
hoje.setHours(0, 0, 0, 0)

const isAtrasada = computed(() => {
  if (props.manutencao.status !== 'SCHEDULED') return false
  const d = new Date(props.manutencao.date)
  d.setHours(0, 0, 0, 0)
  return d < hoje
})

const statusColor = computed(() => {
  if (isAtrasada.value) return 'var(--nd-accent)'
  const map: Record<ManutencaoStatus, string> = {
    SCHEDULED: 'var(--nd-action)',
    STARTED: 'var(--nd-warning)',
    COMPLETED: 'var(--nd-success)',
  }
  return map[props.manutencao.status]
})

const statusLabel = computed(() => {
  if (isAtrasada.value) return 'ATRASADA'
  const map: Record<ManutencaoStatus, string> = {
    SCHEDULED: 'AGENDADA',
    STARTED: 'EM ANDAMENTO',
    COMPLETED: 'CONCLUÍDA',
  }
  return map[props.manutencao.status]
})

const label = computed(() =>
  props.manutencao.contract?.client?.name ?? props.manutencao.type
)

const horario = computed(() => {
  if (!props.manutencao.startTime || !props.manutencao.endTime) return null
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
  return `${fmt(props.manutencao.startTime)}–${fmt(props.manutencao.endTime)}`
})

function hashColor(id: number): string {
  const palette = ['#7C3AED','#0EA5E9','#F97316','#EC4899','#14B8A6','#8B5CF6','#EF4444','#84CC16']
  return palette[id % palette.length]!
}

const avatares = computed(() => props.manutencao.employees.slice(0, 3))

const cardStyle = computed(() => ({
  position: 'absolute' as const,
  top: `${props.topPx}px`,
  height: `${Math.max(props.heightPx, 24)}px`,
  left: `${props.leftPercent}%`,
  width: `calc(${props.widthPercent}% - 4px)`,
  zIndex: popoverOpen.value ? 20 : 10,
}))

function onDoubleClick() {
  popoverOpen.value = false
  emit('expand', props.manutencao)
}

function onPopoverExpand(m: ManutencaoAPI) {
  popoverOpen.value = false
  emit('expand', m)
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <div
        class="cal-card"
        :style="[cardStyle, { '--card-color': statusColor }]"
        :title="statusLabel"
        @dblclick.stop="onDoubleClick"
      >
        <div class="cal-card-label">{{ label }}</div>
        <div v-if="horario" class="cal-card-horario">{{ horario }}</div>
        <div class="cal-card-avatares">
          <div
            v-for="emp in avatares"
            :key="emp.employeeId"
            class="cal-card-avatar"
            :style="{ background: hashColor(emp.employeeId) }"
            :title="emp.name"
          >
            {{ emp.name.charAt(0).toUpperCase() }}
          </div>
          <div v-if="manutencao.employees.length > 3" class="cal-card-avatar cal-card-avatar--more">
            +{{ manutencao.employees.length - 3 }}
          </div>
        </div>
      </div>
    </PopoverTrigger>
    <PopoverContent
      side="right"
      :side-offset="8"
      align="start"
      class="cpv-popover-content"
    >
      <CalendarioPopover
        :manutencao="manutencao"
        @expand="onPopoverExpand"
      />
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.cal-card {
  border-left: 3px solid var(--card-color);
  background: color-mix(in srgb, var(--card-color) 13%, transparent);
  border-radius: 0 4px 4px 0;
  padding: 3px 5px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: filter 100ms ease-out;
  box-sizing: border-box;
}
.cal-card:hover { filter: brightness(1.15); }

.cal-card-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--card-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.cal-card-horario {
  font-family: 'Montserrat', sans-serif;
  font-size: 9px;
  color: var(--nd-text-disabled);
  white-space: nowrap;
}

.cal-card-avatares {
  display: flex;
  gap: 2px;
  margin-top: auto;
}

.cal-card-avatar {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 7px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.cal-card-avatar--more {
  background: var(--nd-border-visible);
  color: var(--nd-text-secondary);
  font-size: 6px;
}

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
