<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Building2, Edit2, Link2, MoreHorizontal, X } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import type { ManutencaoAPI, ManutencaoStatus } from '@/shared/services/manutencaoService'
import { useNominatim } from '@/shared/composables/useNominatim'
import MaintenanceIssueComments from './MaintenanceIssueComments.vue'
import MaintenanceIssueHeader from './MaintenanceIssueHeader.vue'
import MaintenanceIssueSidebar from './MaintenanceIssueSidebar.vue'

const props = defineProps<{
  open: boolean
  manutencao: ManutencaoAPI | null
  canEdit?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [manutencao: ManutencaoAPI]
}>()

const { reverseGeocode } = useNominatim()
const address = ref<string | null>(null)
const addressLoading = ref(false)

const tipoLabel = computed(() => {
  const map: Record<string, string> = {
    PREVENTIVA: 'Manutenção preventiva',
    CORRETIVA: 'Manutenção corretiva',
    MELHORIA: 'Manutenção de melhoria',
  }

  return props.manutencao ? (map[props.manutencao.type] ?? props.manutencao.type) : ''
})

const typeShortLabel = computed(() => {
  const map: Record<string, string> = {
    PREVENTIVA: 'Preventiva',
    CORRETIVA: 'Corretiva',
    MELHORIA: 'Melhoria',
  }

  return props.manutencao ? (map[props.manutencao.type] ?? props.manutencao.type) : ''
})

const summaryLabel = computed(() => {
  const manutencao = props.manutencao
  if (!manutencao) return ''

  const hasTeam = manutencao.employees.length > 0
  const start = manutencao.startTime?.slice(0, 5)
  const end = manutencao.endTime?.slice(0, 5)

  if (!start || !end) {
    return hasTeam ? 'Equipe responsável já alocada.' : 'Equipe responsável ainda não alocada.'
  }

  const [startHour = 0, startMinute = 0] = start.split(':').map(Number)
  const [endHour = 0, endMinute = 0] = end.split(':').map(Number)
  const minutes = Math.max(0, endHour * 60 + endMinute - startHour * 60 - startMinute)
  const duration = minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60}h` : `${minutes}min`

  return hasTeam
    ? `Janela programada de ${duration}, equipe responsável já alocada.`
    : `Janela programada de ${duration}, equipe responsável ainda não alocada.`
})

const statusLabel = computed(() => {
  if (!props.manutencao) return ''

  const labels: Record<ManutencaoStatus, string> = {
    SCHEDULED: 'Agendada',
    STARTED: 'Em andamento',
    COMPLETED: 'Concluída',
  }

  return labels[props.manutencao.status] ?? props.manutencao.status
})

const statusColor = computed(() => {
  if (!props.manutencao) return 'var(--nd-action)'
  if (props.manutencao.status === 'COMPLETED') return 'var(--nd-success)'
  if (props.manutencao.status === 'STARTED') return 'var(--nd-warning)'
  return 'var(--nd-action)'
})

const dateLabel = computed(() => {
  if (!props.manutencao?.date) return 'Sem data'
  const [year = '', month = '', day = ''] = props.manutencao.date.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const weekDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date)
  return `${weekDay}, ${day}/${month}/${year}`
})

const timeLabel = computed(() => {
  if (!props.manutencao?.startTime || !props.manutencao?.endTime) {
    return 'Sem horário definido'
  }

  return `${props.manutencao.startTime.slice(0, 5)} - ${props.manutencao.endTime.slice(0, 5)}`
})

const addressLabel = computed(() => {
  if (address.value) return address.value
  if (props.manutencao?.latitude != null && props.manutencao.longitude != null) {
    return `${props.manutencao.latitude.toFixed(6)}, ${props.manutencao.longitude.toFixed(6)}`
  }

  return 'Sem endereço'
})

async function loadAddress() {
  const manutencao = props.manutencao
  address.value = null

  if (!manutencao || manutencao.latitude == null || manutencao.longitude == null) {
    return
  }

  addressLoading.value = true
  address.value = await reverseGeocode(manutencao.latitude, manutencao.longitude)
  addressLoading.value = false
}

function handleEdit() {
  if (!props.manutencao) return
  emit('edit', props.manutencao)
}

function handleClose() {
  emit('update:open', false)
}

watch(() => props.manutencao?.id, () => {
  void loadAddress()
}, { immediate: true })
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      :show-close-button="false"
      class="mi-dialog w-[calc(100vw-48px)] max-w-[1024px] sm:max-w-[1024px] h-[min(580px,calc(100vh-48px))] min-h-0 p-0 gap-0 overflow-hidden rounded-[10px] border border-[var(--nd-border)] bg-[var(--nd-surface)] shadow-xl max-[900px]:w-[calc(100vw-24px)] max-[900px]:h-[calc(100vh-24px)]"
    >
      <DialogHeader class="sr-only">
        <DialogTitle>Detalhes da manutenção</DialogTitle>
        <DialogDescription>Detalhes e acompanhamento da manutenção selecionada</DialogDescription>
      </DialogHeader>

      <div v-if="manutencao" class="mi-shell">
        <header class="mi-topbar">
          <div class="mi-breadcrumb">
            <Building2 :size="14" />
            <span>Contratos</span>
            <span>/</span>
            <span>{{ manutencao.contract.client.name }}</span>
            <span>/</span>
            <strong># MNT-{{ String(manutencao.id).padStart(3, '0') }}</strong>
          </div>

          <div class="mi-top-actions">
            <button type="button" class="mi-top-button" title="Copiar link">
              <Link2 :size="15" />
            </button>
            <button v-if="canEdit" type="button" class="mi-top-button mi-top-button--edit" title="Editar" @click="handleEdit">
              <Edit2 :size="15" />
            </button>
            <button type="button" class="mi-top-button" title="Mais opções">
              <MoreHorizontal :size="16" />
            </button>
            <button type="button" class="mi-top-button" title="Fechar" @click="handleClose">
              <X :size="17" />
            </button>
          </div>
        </header>

        <div class="mi-body">
          <main class="mi-main">
            <MaintenanceIssueHeader
              :status-label="statusLabel"
              :status-color="statusColor"
              :type-label="typeShortLabel"
              :title-label="tipoLabel"
              :client-name="manutencao.contract.client.name"
              :summary-label="summaryLabel"
            />

            <MaintenanceIssueComments :maintenance-id="manutencao.id" />
          </main>

          <MaintenanceIssueSidebar
            :manutencao="manutencao"
            :tipo-label="typeShortLabel"
            :status-label="statusLabel"
            :date-label="dateLabel"
            :time-label="timeLabel"
            :address-label="addressLabel"
            :address-loading="addressLoading"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.mi-dialog {
  display: block;
}

.mi-shell {
  display: grid;
  grid-template-rows: 48px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--nd-text-primary);
}

.mi-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 0 20px;
  border-bottom: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.mi-breadcrumb {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
  color: var(--nd-text-secondary);
  font-size: 0.72rem;
}

.mi-breadcrumb span,
.mi-breadcrumb strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mi-breadcrumb strong {
  color: var(--nd-text-primary);
  font-weight: 800;
}

.mi-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.mi-top-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  color: var(--nd-text-secondary);
  background: transparent;
  cursor: pointer;
}

.mi-top-button:hover {
  color: var(--nd-text-primary);
  background: var(--nd-surface-raised);
}

.mi-top-button--edit {
  color: var(--nd-text-secondary);
  background: transparent;
}

.mi-top-button--edit:hover {
  color: var(--nd-action);
  background: color-mix(in srgb, var(--nd-action) 22%, transparent);
}

.mi-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  min-height: 0;
}

.mi-main {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

@media (max-width: 900px) {
  .mi-body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .mi-main {
    min-height: 620px;
  }
}
</style>
