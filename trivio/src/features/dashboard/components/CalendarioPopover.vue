<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Maximize2, Copy, Clock, Tag, Users, MapPin } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ManutencaoAPI, ManutencaoStatus } from '@/shared/services/manutencaoService'
import { Badge } from '@/shared/components/ui/badge'
import { useNominatim } from '@/shared/composables/useNominatim'

const { reverseGeocode } = useNominatim()

const props = defineProps<{
  manutencao: ManutencaoAPI
}>()

const emit = defineEmits<{
  expand: [manutencao: ManutencaoAPI]
}>()

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

const clientName = computed(() =>
  props.manutencao.contract?.client?.name ?? 'Sem cliente'
)

const horario = computed((): string | null => {
  if (!props.manutencao.startTime || !props.manutencao.endTime) return null
  return `${props.manutencao.startTime.slice(0, 5)} – ${props.manutencao.endTime.slice(0, 5)}`
})

const tipoLabel = computed(() => {
  const map: Record<string, string> = {
    PREVENTIVA: 'Preventiva',
    CORRETIVA: 'Corretiva',
    MELHORIA: 'Melhoria',
  }
  return map[props.manutencao.type] ?? props.manutencao.type
})

function formatDate(dateStr: string): string {
  const [y = '', m = '', d = ''] = dateStr.split('-')
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
  const diaSemana = dias[dateObj.getDay()]
  return `${diaSemana}, ${d}/${m}/${y}`
}

function hashColor(id: number): string {
  const palette = ['#7C3AED', '#0EA5E9', '#F97316', '#EC4899', '#14B8A6', '#8B5CF6', '#EF4444', '#84CC16']
  return palette[id % palette.length]!
}

function copiarResumo() {
  const m = props.manutencao
  const parts = [
    `${tipoLabel.value} - ${clientName.value}`,
    `Data: ${formatDate(m.date)}`,
  ]
  if (horario.value) parts.push(`Horário: ${horario.value}`)
  if (m.employees.length) {
    parts.push(`Técnicos: ${m.employees.map(e => e.name).join(', ')}`)
  }
  navigator.clipboard.writeText(parts.join('\n'))
  toast.success('Resumo copiado!')
}

function onExpand() {
  emit('expand', props.manutencao)
}

const endereco = ref<string | null>(null)
const enderecoLoading = ref(false)

async function resolverEndereco() {
  const m = props.manutencao
  if (m.latitude == null || m.longitude == null) { endereco.value = null; return }
  enderecoLoading.value = true
  endereco.value = await reverseGeocode(m.latitude, m.longitude)
  enderecoLoading.value = false
}

watch(() => props.manutencao, () => { void resolverEndereco() }, { immediate: true })
</script>

<template>
  <div class="cpv-root">
    <div class="cpv-header">
      <div class="cpv-header-left">
        <span class="cpv-tag" :style="{ color: statusColor, borderColor: statusColor }">
          {{ statusLabel }}
        </span>
      </div>
      <button type="button" class="cpv-expand-btn" title="Abrir detalhes completos" @click.stop="onExpand">
        <Maximize2 :size="14" />
      </button>
    </div>

    <p class="cpv-client">{{ clientName }}</p>
    <span class="cpv-contract">#{{ String(manutencao.contract.id).padStart(3, '0') }}</span>

    <div class="cpv-info-rows">
      <div v-if="horario" class="cpv-info-row">
        <Clock :size="12" class="cpv-info-icon" />
        <span class="cpv-info-text">{{ formatDate(manutencao.date) }} · {{ horario }}</span>
      </div>
      <div v-else class="cpv-info-row">
        <Clock :size="12" class="cpv-info-icon" />
        <span class="cpv-info-text cpv-info-text--dim">{{ formatDate(manutencao.date) }} · sem horário</span>
      </div>

      <div class="cpv-info-row">
        <Tag :size="12" class="cpv-info-icon" />
        <span class="cpv-info-text">{{ tipoLabel }}</span>
      </div>

      <div v-if="enderecoLoading" class="cpv-info-row">
        <MapPin :size="12" class="cpv-info-icon" />
        <span class="cpv-info-text cpv-info-text--dim">Carregando endereço...</span>
      </div>
      <div v-else-if="endereco" class="cpv-info-row" :title="endereco">
        <MapPin :size="12" class="cpv-info-icon" />
        <span class="cpv-info-text cpv-address">{{ endereco }}</span>
      </div>
      <div v-else-if="manutencao.latitude != null && manutencao.longitude != null" class="cpv-info-row">
        <MapPin :size="12" class="cpv-info-icon" />
        <span class="cpv-info-text cpv-address">{{ manutencao.latitude.toFixed(6) }}, {{ manutencao.longitude.toFixed(6) }}</span>
      </div>
      <div v-else class="cpv-info-row">
        <MapPin :size="12" class="cpv-info-icon" />
        <span class="cpv-info-text cpv-info-text--dim">Sem endereço</span>
      </div>
    </div>

    <div class="cpv-footer">
      <div class="cpv-avatars">
        <Users :size="12" class="cpv-info-icon" />
        <template v-if="manutencao.employees.length">
          <div
            v-for="emp in manutencao.employees.slice(0, 4)"
            :key="emp.employeeId"
            class="cpv-avatar-wrapper group relative flex"
          >
            <div
              class="cpv-avatar"
              :style="{ background: hashColor(emp.employeeId) }"
            >
              {{ emp.name.charAt(0).toUpperCase() }}
            </div>
            <Badge variant="secondary" class="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
              {{ emp.name }}
            </Badge>
          </div>
          <span v-if="manutencao.employees.length > 4" class="cpv-avatar-more">
            +{{ manutencao.employees.length - 4 }}
          </span>
        </template>
        <span v-else class="cpv-no-tecnico">Nenhum</span>
      </div>
      <button type="button" class="cpv-copy-btn" title="Copiar resumo" @click.stop="copiarResumo">
        <Copy :size="12" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.cpv-root {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  max-width: 280px;
  font-family: 'Montserrat', sans-serif;
}

.cpv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cpv-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cpv-tag {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 7px;
  border: 1px solid;
  border-radius: 999px;
  white-space: nowrap;
}

.cpv-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid var(--nd-border-visible);
  border-radius: 4px;
  cursor: pointer;
  color: var(--nd-text-secondary);
  transition: color 120ms ease-out, border-color 120ms ease-out;
  flex-shrink: 0;
}
.cpv-expand-btn:hover {
  color: var(--nd-text-display);
  border-color: var(--nd-text-secondary);
}

.cpv-client {
  font-size: 14px;
  font-weight: 600;
  color: var(--nd-text-primary);
  margin: 2px 0 0;
  line-height: 1.3;
}

.cpv-contract {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.03em;
  color: var(--nd-text-disabled);
}

.cpv-info-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--nd-border);
}

.cpv-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cpv-info-icon {
  color: var(--nd-text-disabled);
  flex-shrink: 0;
}

.cpv-info-text {
  font-size: 11px;
  color: var(--nd-text-secondary);
}

.cpv-info-text--dim {
  color: var(--nd-text-disabled);
  font-style: italic;
}

.cpv-address {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.cpv-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid var(--nd-border);
}

.cpv-avatars {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cpv-avatar-wrapper {
  margin-left: -2px;
}
.cpv-avatar-wrapper:first-of-type {
  margin-left: 0;
}

.cpv-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  border: 1px solid var(--nd-surface);
}

.cpv-avatar-more {
  font-size: 9px;
  font-weight: 600;
  color: var(--nd-text-disabled);
  margin-left: 2px;
}

.cpv-no-tecnico {
  font-size: 10px;
  color: var(--nd-text-disabled);
  font-style: italic;
}

.cpv-copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid var(--nd-border-visible);
  border-radius: 4px;
  cursor: pointer;
  color: var(--nd-text-secondary);
  transition: color 120ms ease-out, border-color 120ms ease-out;
  flex-shrink: 0;
}
.cpv-copy-btn:hover {
  color: var(--nd-text-display);
  border-color: var(--nd-text-secondary);
}
</style>
