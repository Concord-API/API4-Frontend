<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Clock, Tag, Calendar, Users, Building2, Edit2, MapPin } from 'lucide-vue-next'
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
import { manutencaoService, type ManutencaoAPI, type ManutencaoStatus, type ManutencaoTipo } from '@/shared/services/manutencaoService'
import { MapLatLngField } from '@/shared/components/ui/map-field'
import { contratoService, type ContratoAPI } from '@/shared/services/contratoService'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { useNominatim } from '@/shared/composables/useNominatim'

const { reverseGeocode } = useNominatim()

export type ModalMode = 'detalhe' | 'edicao' | 'criacao'

export interface CriacaoContext {
  dateStr: string
  hour: number
  tecnico: TecnicoAPI | null
}

const props = defineProps<{
  open: boolean
  mode: ModalMode
  manutencao?: ManutencaoAPI | null
  criacaoContext?: CriacaoContext | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:mode': [value: ModalMode]
  saved: []
}>()

const internalMode = ref<ModalMode>(props.mode)
watch(() => props.mode, (v) => { internalMode.value = v })

const contratos = ref<ContratoAPI[]>([])
const tecnicos = ref<TecnicoAPI[]>([])

async function carregarDados() {
  try {
    const [c, t] = await Promise.all([contratoService.listar(), tecnicoService.listar()])
    contratos.value = c; tecnicos.value = t
  } catch { /* silencioso */ }
}

const contratoOptions = computed(() =>
  contratos.value.map(c => ({ value: c.id, label: `#${String(c.id).padStart(3, '0')} — ${c.client.name}` })),
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
  { value: 'COMPLETED', label: 'Concluída' },
]

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
  return { contractId: null, date: '', type: 'PREVENTIVA', startTimeLocal: '', endTimeLocal: '', status: 'SCHEDULED', employeeIds: [], latitude: null, longitude: null }
}

function padHour(h: number): string { return `${String(h).padStart(2, '0')}:00` }

function formFromManutencao(m: ManutencaoAPI): FormState {
  const toLocal = (iso: string | undefined): string => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return { contractId: m.contract.id, date: m.date, type: m.type, startTimeLocal: toLocal(m.startTime), endTimeLocal: toLocal(m.endTime), status: m.status, employeeIds: m.employees.map(e => e.employeeId), latitude: m.latitude ?? null, longitude: m.longitude ?? null }
}

function formFromContext(ctx: CriacaoContext): FormState {
  return { contractId: null, date: ctx.dateStr, type: 'PREVENTIVA', startTimeLocal: padHour(ctx.hour), endTimeLocal: padHour(Math.min(ctx.hour + 1, 23)), status: 'SCHEDULED', employeeIds: ctx.tecnico ? [ctx.tecnico.employeeId] : [], latitude: null, longitude: null }
}

const form = ref<FormState>(defaultForm())
const submitError = ref<string | null>(null)
const submitting = ref(false)

watch(() => props.open, (isOpen) => {
  submitError.value = null
  if (!isOpen) { internalMode.value = props.mode; return }
  void carregarDados()
  if (props.mode === 'edicao' && props.manutencao) form.value = formFromManutencao(props.manutencao)
  else if (props.mode === 'criacao' && props.criacaoContext) form.value = formFromContext(props.criacaoContext)
  else if (props.mode === 'criacao') form.value = defaultForm()
})

watch(internalMode, (mode) => {
  if (mode === 'edicao' && props.manutencao) { form.value = formFromManutencao(props.manutencao); submitError.value = null }
})

const enderecoDetalhe = ref<string | null>(null)
const enderecoLoading = ref(false)

async function resolverEnderecoDetalhe() {
  if (!props.manutencao || props.manutencao.latitude == null || props.manutencao.longitude == null) {
    enderecoDetalhe.value = null
    return
  }
  enderecoLoading.value = true
  enderecoDetalhe.value = await reverseGeocode(props.manutencao.latitude, props.manutencao.longitude)
  enderecoLoading.value = false
}

watch(() => props.manutencao, () => {
  if (internalMode.value === 'detalhe') {
    void resolverEnderecoDetalhe()
  }
}, { immediate: true })

watch(internalMode, (mode) => {
  if (mode === 'detalhe') {
    void resolverEnderecoDetalhe()
  }
})

function toIso(dateStr: string, timeLocal: string): string | undefined {
  if (!dateStr || !timeLocal) return undefined
  return new Date(`${dateStr}T${timeLocal}`).toISOString()
}

async function submitForm() {
  if (!form.value.contractId) { toast.error('Selecione um contrato.'); return }
  submitError.value = null; submitting.value = true
  const payload = {
    contractId: form.value.contractId, date: form.value.date,
    preventive: form.value.type === 'PREVENTIVA', type: form.value.type,
    status: form.value.status, employeeIds: form.value.employeeIds,
    startTime: toIso(form.value.date, form.value.startTimeLocal),
    endTime: toIso(form.value.date, form.value.endTimeLocal),
    ...(form.value.latitude != null && form.value.longitude != null
      ? { latitude: form.value.latitude, longitude: form.value.longitude }
      : {}),
  }
  try {
    if (internalMode.value === 'edicao' && props.manutencao) {
      await manutencaoService.atualizar(props.manutencao.id, payload); toast.success('Manutenção atualizada.')
    } else {
      await manutencaoService.criar(payload); toast.success('Manutenção cadastrada com sucesso.')
    }
    emit('update:open', false); emit('saved')
  } catch (error) {
    const msg = getApiErrorMessage(error, 'Não foi possível salvar a manutenção.')
    submitError.value = msg; toast.error(msg)
  } finally { submitting.value = false }
}

function isPast(dateStr: string): boolean {
  const h = new Date(); h.setHours(0,0,0,0); const d = new Date(dateStr); d.setHours(0,0,0,0); return d < h
}

const statusColor = computed((): string => {
  if (!props.manutencao) return 'var(--nd-action)'
  const s = props.manutencao.status
  if (s === 'SCHEDULED') return isPast(props.manutencao.date) ? 'var(--nd-accent)' : 'var(--nd-action)'
  if (s === 'STARTED') return 'var(--nd-warning)'
  return 'var(--nd-success)'
})

const statusLabel = computed((): string => {
  if (!props.manutencao) return ''
  const s = props.manutencao.status
  if (s === 'SCHEDULED') return isPast(props.manutencao.date) ? 'ATRASADA' : 'AGENDADA'
  if (s === 'STARTED') return 'EM ANDAMENTO'
  return 'CONCLUÍDA'
})

const horario = computed((): string | null => {
  if (!props.manutencao?.startTime || !props.manutencao?.endTime) return null
  const fmt = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
  return `${fmt(props.manutencao.startTime)} – ${fmt(props.manutencao.endTime)}`
})

const tipoLabel = computed(() => {
  const map: Record<string, string> = { PREVENTIVA: 'Preventiva', CORRETIVA: 'Corretiva', MELHORIA: 'Melhoria' }
  return props.manutencao ? (map[props.manutencao.type] ?? props.manutencao.type) : ''
})

function formatDate(dateStr: string): string {
  const [y = '', m = '', d = ''] = dateStr.split('-')
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
  return `${dias[dateObj.getDay()]}, ${d}/${m}/${y}`
}

function hashColor(id: number): string {
  const palette = ['#7C3AED','#0EA5E9','#F97316','#EC4899','#14B8A6','#8B5CF6','#EF4444','#84CC16']
  return palette[id % palette.length]!
}

function switchToEdicao() { internalMode.value = 'edicao'; emit('update:mode', 'edicao') }
function switchToDetalhe() { internalMode.value = 'detalhe'; emit('update:mode', 'detalhe') }
function handleOpenChange(val: boolean) { emit('update:open', val) }

const contractIdModel = computed<string | number | null>({
  get: () => form.value.contractId,
  set: (v) => { form.value.contractId = v === null ? null : Number(v) },
})
const typeModel = computed<string | number | null>({
  get: () => form.value.type,
  set: (v) => { form.value.type = (v as ManutencaoTipo | null) ?? 'PREVENTIVA' },
})
const statusModel = computed<string | number | null>({
  get: () => form.value.status,
  set: (v) => { form.value.status = (v as ManutencaoStatus | null) ?? 'SCHEDULED' },
})
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent :show-close-button="false" class="w-[95vw] sm:w-[680px] max-w-[680px] p-0 gap-0 overflow-hidden flex flex-col !rounded-lg border-0 shadow-xl">

      <template v-if="internalMode === 'detalhe'">
        <DialogHeader class="sr-only">
          <DialogTitle>Detalhes da manutenção</DialogTitle>
          <DialogDescription>Detalhes da manutenção selecionada</DialogDescription>
        </DialogHeader>

        <div v-if="manutencao" class="cm-layout">
          <div class="cm-main">
            <div class="cm-top-bar">
              <span class="cm-tag" :style="{ color: statusColor, borderColor: statusColor }">{{ statusLabel }}</span>
              <div class="cm-top-actions">
                <button type="button" class="cm-icon-btn" @click="switchToEdicao" title="Editar">
                  <Edit2 :size="14" />
                </button>
              </div>
            </div>

            <h2 class="cm-client-name">{{ manutencao.contract.client.name }}</h2>
            <span class="cm-contract-id">#{{ String(manutencao.contract.id).padStart(3, '0') }}</span>

            <div class="cm-info-grid">
              <div class="cm-info-item">
                <Calendar :size="14" class="cm-info-icon" />
                <div class="cm-info-content">
                  <span class="cm-info-label">Data</span>
                  <span class="cm-info-value">{{ formatDate(manutencao.date) }}</span>
                </div>
              </div>

              <div class="cm-info-item">
                <Clock :size="14" class="cm-info-icon" />
                <div class="cm-info-content">
                  <span class="cm-info-label">Horário</span>
                  <span class="cm-info-value">{{ horario ?? 'Sem horário definido' }}</span>
                </div>
              </div>

              <div class="cm-info-item">
                <Tag :size="14" class="cm-info-icon" />
                <div class="cm-info-content">
                  <span class="cm-info-label">Tipo</span>
                  <span class="cm-info-value">{{ tipoLabel }}</span>
                </div>
              </div>

              <div class="cm-info-item">
                <Building2 :size="14" class="cm-info-icon" />
                <div class="cm-info-content">
                  <span class="cm-info-label">Contrato</span>
                  <span class="cm-info-value">#{{ String(manutencao.contract.id).padStart(3, '0') }}</span>
                </div>
              </div>

              <div v-if="enderecoLoading" class="cm-info-item">
                <MapPin :size="14" class="cm-info-icon" />
                <div class="cm-info-content">
                  <span class="cm-info-label">Endereço</span>
                  <span class="cm-info-value cpv-info-text--dim">Carregando endereço...</span>
                </div>
              </div>
              <div v-else-if="enderecoDetalhe" class="cm-info-item cm-info-item--full">
                <MapPin :size="14" class="cm-info-icon" />
                <div class="cm-info-content">
                  <span class="cm-info-label">Endereço</span>
                  <span class="cm-info-value">{{ enderecoDetalhe }}</span>
                </div>
              </div>
              <div v-else-if="manutencao.latitude != null && manutencao.longitude != null" class="cm-info-item cm-info-item--full">
                <MapPin :size="14" class="cm-info-icon" />
                <div class="cm-info-content">
                  <span class="cm-info-label">Endereço</span>
                  <span class="cm-info-value">{{ manutencao.latitude.toFixed(6) }}, {{ manutencao.longitude.toFixed(6) }}</span>
                </div>
              </div>
              <div v-else class="cm-info-item">
                <MapPin :size="14" class="cm-info-icon" />
                <div class="cm-info-content">
                  <span class="cm-info-label">Endereço</span>
                  <span class="cm-info-value cpv-info-text--dim">Sem endereço</span>
                </div>
              </div>
            </div>
          </div>

          <div class="cm-aside">
            <div class="cm-aside-header">
              <Users :size="14" class="cm-info-icon" />
              <span class="cm-aside-title">Técnicos</span>
              <span class="cm-aside-count">{{ manutencao.employees.length }}</span>
            </div>
            <div v-if="manutencao.employees.length" class="cm-tecnico-list">
              <div v-for="emp in manutencao.employees" :key="emp.employeeId" class="cm-tecnico-item">
                <div class="cm-tecnico-avatar" :style="{ background: hashColor(emp.employeeId) }">
                  {{ emp.name.charAt(0).toUpperCase() }}
                </div>
                <span class="cm-tecnico-name">{{ emp.name }}</span>
              </div>
            </div>
            <p v-else class="cm-no-tecnico">Nenhum técnico alocado</p>
          </div>
        </div>
      </template>

      <template v-else>
        <DialogHeader class="sr-only">
          <DialogTitle>{{ internalMode === 'edicao' ? 'Editar manutenção' : 'Nova manutenção' }}</DialogTitle>
          <DialogDescription>{{ internalMode === 'edicao' ? 'Editar manutenção' : 'Nova manutenção' }}</DialogDescription>
        </DialogHeader>

        <div class="cm-layout">
          <div class="cm-main">
            <div class="cm-top-bar">
              <h2 class="cm-form-title">{{ internalMode === 'edicao' ? 'Editar manutenção' : 'Nova manutenção' }}</h2>
              <div class="cm-top-actions">
                <button type="submit" form="cm-form" class="nd-btn-primary cm-btn-sm" :disabled="submitting">
                  {{ internalMode === 'edicao' ? 'Salvar' : 'Cadastrar' }}
                </button>
                <button v-if="internalMode === 'edicao'" type="button" class="nd-btn-secondary cm-btn-sm" @click="switchToDetalhe">Cancelar</button>
                <DialogClose v-else as-child>
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
                  <input v-model="form.date" type="date" class="nd-field-input" required />
                </div>
                <div class="nd-field">
                  <label class="nd-field-label">Tipo *</label>
                  <NdCombobox v-model="typeModel" :options="tipoOptions" placeholder="Selecione o tipo" />
                </div>
              </div>

              <div class="cm-form-row cm-form-row--half">
                <div class="nd-field">
                  <label class="nd-field-label">Horário início</label>
                  <input v-model="form.startTimeLocal" type="time" class="nd-field-input" />
                </div>
                <div class="nd-field">
                  <label class="nd-field-label">Horário fim</label>
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
                  <label class="nd-field-label">Localização</label>
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
              <span class="cm-aside-title">Técnicos</span>
            </div>
            <NdMultiCombobox
              v-model="form.employeeIds"
              :options="tecnicoOptions"
              placeholder="Adicionar técnicos"
              search-placeholder="Buscar técnico..."
              singular-label="técnico"
              plural-label="técnicos"
            />
            <div v-if="form.employeeIds.length" class="cm-tecnico-list cm-tecnico-list--form">
              <div v-for="empId in form.employeeIds" :key="empId" class="cm-tecnico-item">
                <div class="cm-tecnico-avatar" :style="{ background: hashColor(empId) }">
                  {{ (tecnicos.find(t => t.employeeId === empId)?.name ?? '?').charAt(0).toUpperCase() }}
                </div>
                <span class="cm-tecnico-name">{{ tecnicos.find(t => t.employeeId === empId)?.name ?? `#${empId}` }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

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

.cm-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  color: var(--nd-text-secondary);
  transition: all 150ms ease-out;
}

.cm-icon-btn:hover {
  background: var(--nd-surface-raised);
  color: var(--nd-text-primary);
  border-color: var(--nd-border);
}

.cm-tag {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 3px 10px;
  border: 1px solid;
  border-radius: 999px;
  white-space: nowrap;
}

.cm-client-name {
  font-family: 'Montserrat', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--nd-text-primary);
  margin: 0;
  line-height: 1.3;
}

.cm-contract-id {
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  color: var(--nd-text-disabled);
  letter-spacing: 0.03em;
  margin-top: -8px;
}

.cm-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--nd-border);
}

.cm-info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.cm-info-item--full {
  grid-column: 1 / -1;
}

.cpv-info-text--dim {
  color: var(--nd-text-disabled);
  font-style: italic;
  font-size: 13px;
}

.cm-info-icon {
  color: var(--nd-text-disabled);
  flex-shrink: 0;
  margin-top: 2px;
}

.cm-info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cm-info-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--nd-text-disabled);
  text-transform: uppercase;
}

.cm-info-value {
  font-family: 'Montserrat', sans-serif;
  font-size: 13px;
  color: var(--nd-text-primary);
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

.cm-aside-count {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--nd-text-disabled);
  background: var(--nd-border-visible);
  border-radius: 999px;
  padding: 1px 6px;
  margin-left: auto;
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

.cm-no-tecnico {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  color: var(--nd-text-disabled);
  font-style: italic;
  margin: 0;
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
    max-height: 80vh;
    overflow-y: auto;
  }
  .cm-aside {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--nd-border);
  }
  .cm-form-row--half {
    flex-direction: column;
  }
  .cm-info-grid {
    grid-template-columns: 1fr;
  }
  .cm-main {
    padding: 16px;
  }
}
</style>
