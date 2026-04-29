<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ManutencaoAPI, ManutencaoStatus } from '@/shared/services/manutencaoService'
import type { DiaDaSemana } from '@/features/dashboard/composables/useCalendario'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import CalendarioPopover from './CalendarioPopover.vue'

const props = defineProps<{
  dias: DiaDaSemana[]
  manutencoes: ManutencaoAPI[]
  scrollbarWidth: number
}>()

const emit = defineEmits<{
  'card-expand': [manutencao: ManutencaoAPI]
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

const hasAny = computed(() => porDia.value.some(ms => ms.length > 0))

function onChipExpand(m: ManutencaoAPI) {
  emit('card-expand', m)
}
</script>

<template>
  <div v-if="hasAny" class="cal-banner">
    <div class="cal-banner-label">sem horário</div>
    <div class="cal-banner-cols">
      <div
        v-for="(ms, i) in porDia"
        :key="i"
        class="cal-banner-col"
      >
        <Popover v-for="m in ms" :key="m.id">
          <PopoverTrigger as-child>
            <button
              class="cal-banner-chip"
              :style="{ '--chip-color': statusColor(m) }"
              :title="m.contract?.client?.name ?? m.type"
              @dblclick.stop="onChipExpand(m)"
            >
              {{ m.contract?.client?.name ?? m.type }}
            </button>
          </PopoverTrigger>
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
    <div class="cal-scrollbar-spacer" :style="{ width: scrollbarWidth + 'px' }" />
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
  padding-right: 6px;
  border-right: 1px solid var(--nd-border);
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
}
.cal-banner-col:last-child { border-right: none; }

.cal-banner-chip {
  all: unset;
  display: block;
  background: color-mix(in srgb, var(--chip-color) 13%, transparent);
  border-left: 2px solid var(--chip-color);
  color: var(--chip-color);
  font-family: 'Montserrat', sans-serif;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 0 2px 2px 0;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  transition: filter 100ms ease-out;
  box-sizing: border-box;
}
.cal-banner-chip:hover { filter: brightness(1.15); }

.cal-scrollbar-spacer {
  flex-shrink: 0;
  border-left: 1px solid var(--nd-border);
  background: inherit;
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
