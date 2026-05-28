<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Building2, Calendar, Check, Clock, Loader2, MapPin, Tag, UserPlus, Users, X } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
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

const selectedContract = computed(() =>
  contratos.value.find(c => c.id === form.value.contractId) ?? null,
)

const selectedEmployees = computed(() =>
  form.value.employeeIds.map(id => {
    const tecnico = tecnicos.value.find(t => t.employeeId === id)
    return {
      id,
      name: tecnico?.name ?? `#${id}`,
      admin: Boolean(tecnico?.admin),
    }
  }),
)

const tipoOptions: Array<{ value: ManutencaoTipo; label: string }> = [
  { value: 'PREVENTIVA', label: 'Preventiva' },
  { value: 'CORRETIVA', label: 'Corretiva' },
  { value: 'MELHORIA', label: 'Melhoria' },
]

const statusOptions: Array<{ value: ManutencaoStatus; label: string }> = [
  { value: 'SCHEDULED', label: 'Agendada' },
  { value: 'STARTED', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluida' },
]

const statusLabel = computed(() => statusLabelFor(form.value.status))
const tipoLabel = computed(() => typeShortLabelFor(form.value.type))

const statusColor = computed(() => {
  if (form.value.status === 'COMPLETED') return 'var(--nd-success)'
  if (form.value.status === 'STARTED') return 'var(--nd-warning)'
  return 'var(--nd-action)'
})

const titleLabel = computed(() => {
  if (!selectedContract.value) return 'Nova manutencao'
  return `${typeLongLabel(form.value.type)} - ${selectedContract.value.client.name}`
})

const dateLabel = computed(() => {
  if (!form.value.date) return 'Sem data'
  const [year = '', month = '', day = ''] = form.value.date.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const weekDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date)
  return `${weekDay}, ${day}/${month}/${year}`
})

const timeLabel = computed(() => {
  if (!form.value.startTimeLocal || !form.value.endTimeLocal) return 'Sem horario definido'
  return `${form.value.startTimeLocal} - ${form.value.endTimeLocal}`
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

function typeLongLabel(type: ManutencaoTipo) {
  const map: Record<ManutencaoTipo, string> = {
    PREVENTIVA: 'Manutencao preventiva',
    CORRETIVA: 'Manutencao corretiva',
    MELHORIA: 'Manutencao de melhoria',
  }

  return map[type]
}

function typeShortLabelFor(type: ManutencaoTipo) {
  const map: Record<ManutencaoTipo, string> = {
    PREVENTIVA: 'Preventiva',
    CORRETIVA: 'Corretiva',
    MELHORIA: 'Melhoria',
  }

  return map[type]
}

function statusLabelFor(status: ManutencaoStatus) {
  const labels: Record<ManutencaoStatus, string> = {
    SCHEDULED: 'Agendada',
    STARTED: 'Em andamento',
    COMPLETED: 'Concluida',
  }

  return labels[status]
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

function hashColor(id: number): string {
  const palette = ['var(--nd-interactive)', 'var(--nd-action)', 'var(--nd-warning)', 'var(--nd-success)', 'var(--nd-accent)']
  return palette[id % palette.length]!
}

function roleLabel(admin: boolean) {
  return admin ? 'Relator' : 'Responsavel'
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

function handleOpenChange(value: boolean) {
  if (!value && submitting.value) return
  emit('update:open', value)
}

function closeModal() {
  handleOpenChange(false)
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
    active: true,
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
    <DialogContent
      :show-close-button="false"
      class="cm-dialog w-[calc(100vw-48px)] max-w-[1024px] sm:max-w-[1024px] h-[min(580px,calc(100vh-48px))] min-h-0 p-0 gap-0 overflow-hidden rounded-[10px] border border-[var(--nd-border)] bg-[var(--nd-surface)] shadow-xl max-[900px]:w-[calc(100vw-24px)] max-[900px]:h-[calc(100vh-24px)]"
    >
      <DialogHeader class="sr-only">
        <DialogTitle>Nova manutencao</DialogTitle>
        <DialogDescription>Cadastro de uma nova manutencao</DialogDescription>
      </DialogHeader>

      <div class="cm-shell">
        <header class="cm-topbar">
          <div class="cm-breadcrumb">
            <Building2 :size="14" />
            <span>Contratos</span>
            <span>/</span>
            <strong>Nova manutencao</strong>
          </div>

          <div class="cm-top-actions">
            <button type="button" class="cm-cancel-button" :disabled="submitting" @click="closeModal">
              <X :size="14" />
              Cancelar
            </button>
            <button type="submit" form="cm-form" class="cm-save-button" :disabled="submitting">
              <Loader2 v-if="submitting" :size="15" class="cm-spin" />
              <Check v-else :size="15" />
              Cadastrar
            </button>
            <button type="button" class="cm-top-button" title="Fechar" :disabled="submitting" @click="closeModal">
              <X :size="17" />
            </button>
          </div>
        </header>

        <form id="cm-form" class="cm-body" @submit.prevent="submitForm">
          <main class="cm-main">
            <section class="cm-title-section">
              <div class="cm-badges">
                <Select v-model="statusModel">
                  <SelectTrigger class="cm-badge-trigger cm-status" :style="{ color: statusColor, borderColor: statusColor }">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent class="cm-select-content">
                    <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value" class="cm-select-item">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="typeModel">
                  <SelectTrigger class="cm-badge-trigger cm-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent class="cm-select-content">
                    <SelectItem v-for="option in tipoOptions" :key="option.value" :value="option.value" class="cm-select-item">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <h2>{{ titleLabel }}</h2>
            </section>

            <section class="cm-form-section">
              <div class="cm-section-heading">
                <MapPin :size="15" />
                <h3>Localizacao</h3>
              </div>

              <MapLatLngField
                v-model:modelLat="form.latitude"
                v-model:modelLng="form.longitude"
              />

              <div v-if="submitError" class="cm-error">{{ submitError }}</div>
            </section>
          </main>

          <aside class="cm-sidebar">
            <section class="cm-sidebar-section">
              <h3>Detalhes</h3>

              <dl class="cm-detail-list">
                <div class="cm-detail-row">
                  <dt><Building2 :size="15" />Contrato</dt>
                  <dd>
                    <NdCombobox
                      v-model="contractIdModel"
                      :options="contratoOptions"
                      placeholder="Selecione o contrato"
                      search-placeholder="Buscar contrato..."
                    />
                  </dd>
                </div>

                <div class="cm-detail-row">
                  <dt><Calendar :size="15" />Data</dt>
                  <dd>
                    <NdDatePicker v-model="form.date" required />
                    <span class="cm-detail-hint">{{ dateLabel }}</span>
                  </dd>
                </div>

                <div class="cm-detail-row">
                  <dt><Clock :size="15" />Horario</dt>
                  <dd class="cm-time-fields">
                    <input v-model="form.startTimeLocal" type="time" class="cm-edit-field" />
                    <span>-</span>
                    <input v-model="form.endTimeLocal" type="time" class="cm-edit-field" />
                    <span class="cm-detail-hint cm-detail-hint--wide">{{ timeLabel }}</span>
                  </dd>
                </div>

                <div class="cm-detail-row">
                  <dt><Tag :size="15" />Tipo</dt>
                  <dd>
                    <NdCombobox
                      v-model="typeModel"
                      :options="tipoOptions"
                      placeholder="Selecione o tipo"
                    />
                  </dd>
                </div>
              </dl>
            </section>

            <section class="cm-sidebar-section">
              <div class="cm-sidebar-title-row">
                <h3>Pessoas</h3>
                <UserPlus :size="14" />
              </div>

              <NdMultiCombobox
                v-model="form.employeeIds"
                :options="tecnicoOptions"
                placeholder="Adicionar tecnicos"
                search-placeholder="Buscar tecnico..."
                singular-label="tecnico"
                plural-label="tecnicos"
              />

              <div v-if="selectedEmployees.length" class="cm-people-list">
                <div v-for="employee in selectedEmployees" :key="employee.id" class="cm-person">
                  <div class="cm-avatar" :style="{ background: hashColor(employee.id) }">
                    {{ initials(employee.name) }}
                  </div>
                  <div class="cm-person-text">
                    <strong>{{ employee.name }}</strong>
                    <span>{{ roleLabel(employee.admin) }}</span>
                  </div>
                </div>
              </div>

              <p v-else class="cm-empty">
                <Users :size="15" />
                Nenhum tecnico alocado
              </p>
            </section>
          </aside>
        </form>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.cm-dialog {
  display: block;
}

.cm-shell {
  display: grid;
  grid-template-rows: 48px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--nd-text-primary);
}

.cm-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 0 20px;
  border-bottom: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.cm-breadcrumb {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
  color: var(--nd-text-secondary);
  font-size: 0.72rem;
}

.cm-breadcrumb span,
.cm-breadcrumb strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-breadcrumb strong {
  color: var(--nd-text-primary);
  font-weight: 800;
}

.cm-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.cm-top-button,
.cm-cancel-button,
.cm-save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: pointer;
}

.cm-top-button {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: var(--nd-text-secondary);
  background: transparent;
}

.cm-top-button:hover {
  color: var(--nd-text-primary);
  background: var(--nd-surface-raised);
}

.cm-cancel-button {
  gap: 6px;
  min-height: 32px;
  border-radius: 4px;
  color: var(--nd-text-secondary);
  background: transparent;
  font-size: 0.78rem;
}

.cm-cancel-button:hover {
  color: var(--nd-text-primary);
}

.cm-save-button {
  gap: 6px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--nd-action-foreground);
  background: var(--nd-action);
  font-size: 0.78rem;
  font-weight: 800;
}

.cm-save-button:hover {
  background: var(--nd-action-hover);
}

.cm-top-button:disabled,
.cm-cancel-button:disabled,
.cm-save-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.cm-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  min-height: 0;
}

.cm-main {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  background: var(--nd-surface);
}

.cm-title-section {
  display: grid;
  align-content: start;
  min-height: 132px;
  gap: 14px;
  padding: 20px 24px 18px;
  border-bottom: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.cm-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.cm-status,
.cm-type {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 800;
}

.cm-status {
  border: 1px solid;
  text-transform: uppercase;
}

.cm-type {
  border: 1px solid var(--nd-border-visible);
  color: var(--nd-interactive);
  background: var(--nd-surface-raised);
}

.cm-badge-trigger {
  width: auto;
  height: 24px;
  min-height: 24px;
  gap: 6px;
  border-radius: 4px;
  padding: 0 8px 0 10px;
  box-shadow: none;
  font-size: 0.68rem;
  font-weight: 800;
}

.cm-badge-trigger :deep(svg) {
  width: 12px;
  height: 12px;
  opacity: 0.8;
}

.cm-title-section h2 {
  margin: 0;
  color: var(--nd-text-primary);
  font-size: 1.24rem;
  font-weight: 800;
  line-height: 1.2;
}

:global(.cm-select-content) {
  border-color: var(--nd-border-visible);
  border-radius: 4px;
  background: var(--nd-surface-raised);
}

:global(.cm-select-item) {
  color: var(--nd-text-primary);
  font-size: 0.78rem;
}

:global(.cm-select-item[data-highlighted]),
:global(.cm-select-item[data-state="checked"]) {
  color: #0b0f14;
}

.cm-form-section {
  display: grid;
  align-content: start;
  gap: 16px;
  min-height: 0;
  padding: 22px 24px;
  overflow-y: auto;
}

.cm-section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--nd-text-secondary);
}

.cm-section-heading h3 {
  margin: 0;
  color: var(--nd-text-primary);
  font-size: 0.86rem;
  font-weight: 800;
}

.cm-error {
  color: var(--nd-accent);
  font-size: 0.78rem;
}

.cm-sidebar {
  display: flex;
  min-height: 0;
  border-left: 1px solid var(--nd-border);
  background: var(--nd-surface);
  overflow-y: auto;
  flex-direction: column;
}

.cm-sidebar-section {
  display: grid;
  gap: 14px;
  padding: 20px;
  border-bottom: 1px solid var(--nd-border);
}

.cm-sidebar-section h3 {
  margin: 0;
  color: var(--nd-text-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cm-sidebar-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--nd-interactive);
}

.cm-detail-list {
  display: grid;
  gap: 14px;
  margin: 0;
}

.cm-detail-row {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.cm-detail-row dt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--nd-text-secondary);
  font-size: 0.78rem;
}

.cm-detail-row dd {
  margin: 0;
  min-width: 0;
  color: var(--nd-text-primary);
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.35;
}

.cm-time-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
}

.cm-detail-hint {
  display: block;
  margin-top: 6px;
  color: var(--nd-text-disabled);
  font-size: 0.68rem;
  font-weight: 500;
}

.cm-detail-hint--wide {
  grid-column: 1 / -1;
}

.cm-edit-field {
  width: 100%;
  min-height: 30px;
  border: 1px solid var(--nd-border);
  border-radius: 10px;
  padding: 0 10px;
  color: var(--nd-text-primary);
  background: var(--nd-bg);
  outline: none;
}

.cm-pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  background: var(--nd-border-visible);
}

.cm-people-list {
  display: grid;
  gap: 14px;
}

.cm-person {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cm-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-size: 0.72rem;
  font-weight: 800;
  flex: 0 0 auto;
}

.cm-person-text {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 4px;
}

.cm-person-text strong {
  min-width: 0;
  color: var(--nd-text-primary);
  font-size: 0.84rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-person-text span {
  color: var(--nd-text-secondary);
  font-size: 0.72rem;
}

.cm-empty {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--nd-text-secondary);
  font-size: 0.8rem;
}

.cm-spin {
  animation: cm-spin 0.8s linear infinite;
}

@keyframes cm-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .cm-body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .cm-main {
    min-height: 420px;
  }

  .cm-sidebar {
    border-top: 1px solid var(--nd-border);
    border-left: 0;
  }
}
</style>
