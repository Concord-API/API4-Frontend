<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Users } from 'lucide-vue-next'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'
import NdMultiCombobox from '@/shared/components/ui/NdMultiCombobox.vue'
import NdDatePicker from '@/shared/components/ui/NdDatePicker.vue'
import { MapLatLngField } from '@/shared/components/ui/map-field'
import { contratoService, type ContratoAPI } from '@/shared/services/contratoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { manutencaoService, type ManutencaoStatus, type ManutencaoTipo } from '@/shared/services/manutencaoService'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { useAuth } from '@/shared/composables/useAuth'

export interface CriacaoContext {
  dateStr: string
  hour: number
  tecnico: TecnicoAPI | null
}

const props = defineProps<{
  open: boolean
  criacaoContext?: CriacaoContext | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const { currentUser } = useAuth()
const isTechnician = computed(() => String(currentUser.value?.role ?? '').toLowerCase() === 'technician')
const contratos = ref<ContratoAPI[]>([])
const tecnicos = ref<TecnicoAPI[]>([])
const submitError = ref<string | null>(null)
const submitting = ref(false)

interface FormState {
  contractId: number | null
  date: string
  type: ManutencaoTipo
  startTimeLocal: string
  endTimeLocal: string
  status: ManutencaoStatus
  employeeIds: number[]
  latitude: number | null
  longitude: number | null
}

function defaultForm(): FormState {
  return {
    contractId: null,
    date: '',
    type: 'PREVENTIVA',
    startTimeLocal: '',
    endTimeLocal: '',
    status: 'SCHEDULED',
    employeeIds: [],
    latitude: null,
    longitude: null,
  }
}

const form = ref<FormState>(defaultForm())

const contratoOptions = computed(() =>
  contratos.value.map(c => ({ value: c.id, label: `#${String(c.id).padStart(3, '0')} - ${c.client.name}` })),
)

const tecnicoOptions = computed(() =>
  tecnicos.value.filter(t => t.active).map(t => ({ value: t.employeeId, label: t.name })),
)

const tipoOptions = [
  { value: 'PREVENTIVA', label: 'Preventiva' },
  { value: 'CORRETIVA', label: 'Corretiva' },
  { value: 'MELHORIA', label: 'Melhoria' },
]

const statusOptions = [
  { value: 'SCHEDULED', label: 'Programada' },
  { value: 'STARTED', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluida' },
]

function padHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

function formFromContext(context: CriacaoContext): FormState {
  return {
    contractId: null,
    date: context.dateStr,
    type: 'PREVENTIVA',
    startTimeLocal: padHour(context.hour),
    endTimeLocal: padHour(Math.min(context.hour + 1, 23)),
    status: 'SCHEDULED',
    employeeIds: context.tecnico ? [context.tecnico.employeeId] : [],
    latitude: null,
    longitude: null,
  }
}

async function carregarDados() {
  try {
    const [contratosResponse, tecnicosResponse] = await Promise.all([
      contratoService.listar(),
      tecnicoService.listar(),
    ])
    contratos.value = contratosResponse
    tecnicos.value = tecnicosResponse
  } catch {}
}

watch(() => props.open, isOpen => {
  submitError.value = null

  if (!isOpen) return

  void carregarDados()

  if (props.criacaoContext) {
    form.value = formFromContext(props.criacaoContext)
    return
  }

  form.value = defaultForm()
})

const contractIdModel = computed<string | number | null>({
  get: () => form.value.contractId,
  set: value => { form.value.contractId = value === null ? null : Number(value) },
})

const typeModel = computed<string | number | null>({
  get: () => form.value.type,
  set: value => { form.value.type = (value as ManutencaoTipo | null) ?? 'PREVENTIVA' },
})

const statusModel = computed<string | number | null>({
  get: () => form.value.status,
  set: value => { form.value.status = (value as ManutencaoStatus | null) ?? 'SCHEDULED' },
})

function hashColor(id: number): string {
  const palette = ['#7C3AED', '#0EA5E9', '#F97316', '#EC4899', '#14B8A6', '#8B5CF6', '#EF4444', '#84CC16']
  return palette[id % palette.length]!
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

async function submitForm() {
  if (isTechnician.value) {
    toast.error('Tecnicos nao podem editar manutencoes.')
    return
  }

  if (!form.value.contractId) {
    toast.error('Selecione um contrato.')
    return
  }

  if (!form.value.date) {
    toast.error('Selecione uma data.')
    return
  }

  submitError.value = null
  submitting.value = true

  const payload = {
    contractId: form.value.contractId,
    date: form.value.date,
    preventive: form.value.type === 'PREVENTIVA',
    type: form.value.type,
    status: form.value.status,
    employeeIds: form.value.employeeIds,
    startTime: form.value.startTimeLocal || undefined,
    endTime: form.value.endTimeLocal || undefined,
    ...(form.value.latitude != null && form.value.longitude != null
      ? { latitude: form.value.latitude, longitude: form.value.longitude }
      : {}),
  }

  try {
    await manutencaoService.criar(payload)
    toast.success('Manutencao cadastrada com sucesso.')

    emit('update:open', false)
    emit('saved')
  } catch (error) {
    const message = getApiErrorMessage(error, 'Nao foi possivel salvar a manutencao.')
    submitError.value = message
    toast.error(message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent :show-close-button="false" class="w-[95vw] sm:w-[680px] max-w-[680px] p-0 gap-0 overflow-hidden flex flex-col !rounded-lg border-0 shadow-xl">
      <DialogHeader class="sr-only">
        <DialogTitle>Nova manutencao</DialogTitle>
        <DialogDescription>Nova manutencao</DialogDescription>
      </DialogHeader>

      <div class="cm-layout">
        <div class="cm-main">
          <div class="cm-top-bar">
            <h2 class="cm-form-title">Nova manutencao</h2>
            <div class="cm-top-actions">
              <button type="submit" form="cm-form" class="nd-btn-primary cm-btn-sm" :disabled="submitting">
                Cadastrar
              </button>
              <DialogClose as-child>
                <button type="button" class="nd-btn-secondary cm-btn-sm">Cancelar</button>
              </DialogClose>
            </div>
          </div>

          <form id="cm-form" class="cm-form" @submit.prevent="submitForm">
            <div class="cm-form-row">
              <div class="nd-field cm-field-full">
                <label class="nd-field-label">Contrato *</label>
                <NdCombobox v-model="contractIdModel" :options="contratoOptions" placeholder="Selecione o contrato" search-placeholder="Buscar contrato..." />
              </div>
            </div>

            <div class="cm-form-row cm-form-row--half">
              <div class="nd-field">
                <label class="nd-field-label">Data *</label>
                <NdDatePicker v-model="form.date" required />
              </div>
              <div class="nd-field">
                <label class="nd-field-label">Tipo *</label>
                <NdCombobox v-model="typeModel" :options="tipoOptions" placeholder="Selecione o tipo" />
              </div>
            </div>

            <div class="cm-form-row cm-form-row--half">
              <div class="nd-field">
                <label class="nd-field-label">Horario inicio</label>
                <input v-model="form.startTimeLocal" type="time" class="nd-field-input" />
              </div>
              <div class="nd-field">
                <label class="nd-field-label">Horario fim</label>
                <input v-model="form.endTimeLocal" type="time" class="nd-field-input" />
              </div>
            </div>

            <div class="cm-form-row">
              <div class="nd-field cm-field-full">
                <label class="nd-field-label">Status *</label>
                <NdCombobox v-model="statusModel" :options="statusOptions" placeholder="Selecione o status" />
              </div>
            </div>

            <div class="cm-form-row">
              <div class="nd-field cm-field-full">
                <label class="nd-field-label">Localizacao</label>
                <MapLatLngField
                  v-model:modelLat="form.latitude"
                  v-model:modelLng="form.longitude"
                />
              </div>
            </div>

            <div v-if="submitError" class="nd-field-error">{{ submitError }}</div>
          </form>
        </div>

        <div class="cm-aside">
          <div class="cm-aside-header">
            <Users :size="14" class="cm-info-icon" />
            <span class="cm-aside-title">Tecnicos</span>
          </div>
          <NdMultiCombobox
            v-model="form.employeeIds"
            :options="tecnicoOptions"
            placeholder="Adicionar tecnicos"
            search-placeholder="Buscar tecnico..."
            singular-label="tecnico"
            plural-label="tecnicos"
          />
          <div v-if="form.employeeIds.length" class="cm-tecnico-list cm-tecnico-list--form">
            <div v-for="employeeId in form.employeeIds" :key="employeeId" class="cm-tecnico-item">
              <div class="cm-tecnico-avatar" :style="{ background: hashColor(employeeId) }">
                {{ (tecnicos.find(t => t.employeeId === employeeId)?.name ?? '?').charAt(0).toUpperCase() }}
              </div>
              <span class="cm-tecnico-name">{{ tecnicos.find(t => t.employeeId === employeeId)?.name ?? `#${employeeId}` }}</span>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.cm-layout {
  display: flex;
  min-height: 320px;
}

.cm-main {
  flex: 1;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.cm-aside {
  width: 200px;
  flex-shrink: 0;
  background: var(--nd-surface-raised);
  border-left: 1px solid var(--nd-border);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cm-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cm-top-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cm-btn-sm {
  padding: 5px 12px !important;
  font-size: 11px !important;
}

.cm-info-icon {
  color: var(--nd-text-disabled);
  flex-shrink: 0;
  margin-top: 2px;
}

.cm-aside-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--nd-border);
}

.cm-aside-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--nd-text-secondary);
}

.cm-tecnico-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cm-tecnico-list--form {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--nd-border);
}

.cm-tecnico-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cm-tecnico-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.cm-tecnico-name {
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  color: var(--nd-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cm-form-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--nd-text-display);
  margin: 0;
}

.cm-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cm-form-row {
  display: flex;
  gap: 12px;
}

.cm-form-row--half > * {
  flex: 1;
  min-width: 0;
}

.cm-field-full {
  flex: 1;
}

@media (max-width: 640px) {
  .cm-layout {
    flex-direction: column;
    min-height: auto;
  }

  .cm-aside {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--nd-border);
  }

  .cm-form-row--half {
    flex-direction: column;
  }

  .cm-main {
    padding: 16px;
  }
}
</style>
