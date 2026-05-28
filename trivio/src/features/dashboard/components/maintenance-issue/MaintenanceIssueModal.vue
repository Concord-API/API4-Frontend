<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
    PREVENTIVA: 'Manutencao preventiva',
    CORRETIVA: 'Manutencao corretiva',
    MELHORIA: 'Manutencao de melhoria',
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

const statusLabel = computed(() => {
  if (!props.manutencao) return ''

  const labels: Record<ManutencaoStatus, string> = {
    SCHEDULED: 'Agendada',
    STARTED: 'Em andamento',
    COMPLETED: 'Concluida',
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
    return 'Sem horario definido'
  }

  return `${props.manutencao.startTime.slice(0, 5)} - ${props.manutencao.endTime.slice(0, 5)}`
})

const addressLabel = computed(() => {
  if (address.value) return address.value
  if (props.manutencao?.latitude != null && props.manutencao.longitude != null) {
    return `${props.manutencao.latitude.toFixed(6)}, ${props.manutencao.longitude.toFixed(6)}`
  }

  return 'Sem endereco'
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

watch(() => props.manutencao?.id, () => {
  void loadAddress()
}, { immediate: true })
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      :show-close-button="true"
      class="mi-dialog w-[96vw] max-w-[1120px] sm:max-w-[1120px] h-[82vh] min-h-[600px] p-0 gap-0 overflow-hidden rounded-md border border-[var(--nd-border)] bg-[var(--nd-surface)] shadow-xl max-[900px]:h-[90vh] max-[900px]:min-h-0"
    >
      <DialogHeader class="sr-only">
        <DialogTitle>Detalhes da manutencao</DialogTitle>
        <DialogDescription>Detalhes e acompanhamento da manutencao selecionada</DialogDescription>
      </DialogHeader>

      <div v-if="manutencao" class="mi-shell">
        <main class="mi-main">
          <MaintenanceIssueHeader
            :manutencao="manutencao"
            :status-label="statusLabel"
            :status-color="statusColor"
            :tipo-label="tipoLabel"
            :can-edit="canEdit"
            @edit="handleEdit"
          />

          <MaintenanceIssueComments :maintenance-id="manutencao.id" />
        </main>

        <MaintenanceIssueSidebar
          :manutencao="manutencao"
          :tipo-label="typeShortLabel"
          :date-label="dateLabel"
          :time-label="timeLabel"
          :address-label="addressLabel"
          :address-loading="addressLoading"
        />
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
  grid-template-columns: minmax(0, 1fr) 360px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.mi-main {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

@media (max-width: 900px) {
  .mi-shell {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .mi-main {
    min-height: 620px;
  }
}
</style>
