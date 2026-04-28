<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'
import NdMultiCombobox from '@/shared/components/ui/NdMultiCombobox.vue'
import { manutencaoService, type ManutencaoAPI, type ManutencaoStatus, type ManutencaoTipo } from '@/shared/services/manutencaoService'
import { contratoService, type ContratoAPI } from '@/shared/services/contratoService'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { getApiErrorMessage } from '@/shared/services/api'


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

watch(() => props.mode, (newMode) => {
  internalMode.value = newMode
})


const contratos = ref<ContratoAPI[]>([])
const tecnicos = ref<TecnicoAPI[]>([])

async function carregarDados() {
  try {
    const [c, t] = await Promise.all([contratoService.listar(), tecnicoService.listar()])
    contratos.value = c
    tecnicos.value = t
  } catch {

  }
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
  }
}

function padHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

function formFromManutencao(m: ManutencaoAPI): FormState {
  const toLocalTime = (iso: string | undefined): string => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return {
    contractId: m.contract.id,
    date: m.date,
    type: m.type,
    startTimeLocal: toLocalTime(m.startTime),
    endTimeLocal: toLocalTime(m.endTime),
    status: m.status,
    employeeIds: m.employees.map(e => e.employeeId),
  }
}

function formFromContext(ctx: CriacaoContext): FormState {
  const endHour = Math.min(ctx.hour + 1, 23)
  return {
    contractId: null,
    date: ctx.dateStr,
    type: 'PREVENTIVA',
    startTimeLocal: padHour(ctx.hour),
    endTimeLocal: padHour(endHour),
    status: 'SCHEDULED',
    employeeIds: ctx.tecnico ? [ctx.tecnico.employeeId] : [],
  }
}

const form = ref<FormState>(defaultForm())

watch(
  () => props.open,
  (isOpen) => {
    submitError.value = null
    if (!isOpen) {
      internalMode.value = props.mode
      return
    }
    void carregarDados()
    if (props.mode === 'edicao' && props.manutencao) {
      form.value = formFromManutencao(props.manutencao)
    } else if (props.mode === 'criacao' && props.criacaoContext) {
      form.value = formFromContext(props.criacaoContext)
    } else if (props.mode === 'criacao') {
      form.value = defaultForm()
    }
  },
)

watch(internalMode, (mode) => {
  if (mode === 'edicao' && props.manutencao) {
    form.value = formFromManutencao(props.manutencao)
    submitError.value = null
  }
})

const submitError = ref<string | null>(null)
const submitting = ref(false)

function toIso(dateStr: string, timeLocal: string): string | undefined {
  if (!dateStr || !timeLocal) return undefined
  return new Date(`${dateStr}T${timeLocal}`).toISOString()
}

async function submitForm() {
  if (!form.value.contractId) {
    toast.error('Selecione um contrato.')
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
    startTime: toIso(form.value.date, form.value.startTimeLocal),
    endTime: toIso(form.value.date, form.value.endTimeLocal),
  }

  try {
    if (internalMode.value === 'edicao' && props.manutencao) {
      await manutencaoService.atualizar(props.manutencao.id, payload)
      toast.success('Manutenção atualizada.')
    } else {
      await manutencaoService.criar(payload)
      toast.success('Manutenção cadastrada com sucesso.')
    }
    emit('update:open', false)
    emit('saved')
  } catch (error) {
    const msg = getApiErrorMessage(error, 'Não foi possível salvar a manutenção.')
    submitError.value = msg
    toast.error(msg)
  } finally {
    submitting.value = false
  }
}

function isPast(dateStr: string): boolean {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return d < hoje
}

const statusColor = computed((): string => {
  if (!props.manutencao) return 'var(--nd-action)'
  const s = props.manutencao.status
  if (s === 'SCHEDULED') {
    if (isPast(props.manutencao.date)) return 'var(--nd-accent)'
    return 'var(--nd-action)'
  }
  if (s === 'STARTED') return 'var(--nd-warning)'
  return 'var(--nd-success)'
})

const statusLabel = computed((): string => {
  if (!props.manutencao) return ''
  const s = props.manutencao.status
  if (s === 'SCHEDULED') {
    if (isPast(props.manutencao.date)) return 'ATRASADA'
    return 'AGENDADA'
  }
  if (s === 'STARTED') return 'EM ANDAMENTO'
  return 'CONCLUÍDA'
})

const horario = computed((): string | null => {
  if (!props.manutencao?.startTime || !props.manutencao?.endTime) return null
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${fmt(props.manutencao.startTime)} – ${fmt(props.manutencao.endTime)}`
})

function closeModal() {
  emit('update:open', false)
}

function switchToEdicao() {
  internalMode.value = 'edicao'
  emit('update:mode', 'edicao')
}

function switchToDetalhe() {
  internalMode.value = 'detalhe'
  emit('update:mode', 'detalhe')
}

function handleOpenChange(val: boolean) {
  emit('update:open', val)
}

function formatDate(dateStr: string): string {
  const [y = '', m = '', d = ''] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

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
    <DialogContent class="sm:max-w-2xl">

      <template v-if="internalMode === 'detalhe'">
        <DialogHeader>
          <DialogTitle class="nd-dialog-title">DETALHES DA MANUTENÇÃO</DialogTitle>
          <DialogDescription class="sr-only">Detalhes da manutenção selecionada</DialogDescription>
        </DialogHeader>

        <div v-if="manutencao" class="nd-detail">
          <div class="nd-detail-status-row">
            <span
              class="nd-tag nd-tag--lg"
              :style="{ color: statusColor, borderColor: statusColor }"
            >{{ statusLabel }}</span>
            <span class="nd-detail-tipo">{{ manutencao.type }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Cliente</span>
            <span class="nd-detail-value">{{ manutencao.contract.client.name }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Data</span>
            <span class="nd-detail-value nd-detail-value--mono">
              {{ formatDate(manutencao.date) }}
              <template v-if="horario"> · {{ horario }}</template>
            </span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Contrato</span>
            <span class="nd-detail-value">#{{ String(manutencao.contract.id).padStart(3, '0') }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">TÉCNICOS ({{ manutencao.employees.length }})</span>
            <div v-if="manutencao.employees.length" class="nd-detail-list">
              <div
                v-for="emp in manutencao.employees"
                :key="emp.employeeId"
                class="nd-detail-list-item"
              >
                <span class="nd-detail-list-dot" />
                {{ emp.name }}
              </div>
            </div>
            <span v-else class="nd-detail-value nd-detail-value--dim">Nenhum técnico alocado</span>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <button type="button" class="nd-btn-secondary">FECHAR</button>
          </DialogClose>
          <button type="button" class="nd-btn-primary" @click="switchToEdicao">
            Editar
          </button>
        </DialogFooter>
      </template>

      <template v-else>
        <DialogHeader>
          <DialogTitle class="nd-dialog-title">
            {{ internalMode === 'edicao' ? 'EDITAR MANUTENÇÃO' : 'NOVA MANUTENÇÃO' }}
          </DialogTitle>
          <DialogDescription class="sr-only">
            {{ internalMode === 'edicao' ? 'Editar manutenção' : 'Nova manutenção' }}
          </DialogDescription>
        </DialogHeader>

        <form
          class="nd-form grid grid-cols-1 sm:grid-cols-2 gap-x-4"
          @submit.prevent="submitForm"
        >
          <div class="nd-field col-span-full">
            <label class="nd-field-label">Contrato *</label>
            <NdCombobox
              v-model="contractIdModel"
              :options="contratoOptions"
              placeholder="Selecione o contrato"
              search-placeholder="Buscar contrato..."
            />
          </div>

          <div class="nd-field">
            <label class="nd-field-label">Data *</label>
            <input
              v-model="form.date"
              type="date"
              class="nd-field-input"
              required
            />
          </div>

          <div class="nd-field">
            <label class="nd-field-label">Tipo *</label>
            <NdCombobox
              v-model="typeModel"
              :options="tipoOptions"
              placeholder="Selecione o tipo"
            />
          </div>

          <div class="nd-field">
            <label class="nd-field-label">Horário início</label>
            <input
              v-model="form.startTimeLocal"
              type="time"
              class="nd-field-input"
            />
          </div>

          <div class="nd-field">
            <label class="nd-field-label">Horário fim</label>
            <input
              v-model="form.endTimeLocal"
              type="time"
              class="nd-field-input"
            />
          </div>

          <div class="nd-field col-span-full">
            <label class="nd-field-label">Status *</label>
            <NdCombobox
              v-model="statusModel"
              :options="statusOptions"
              placeholder="Selecione o status"
            />
          </div>

          <div class="nd-field col-span-full">
            <label class="nd-field-label">TÉCNICOS</label>
            <NdMultiCombobox
              v-model="form.employeeIds"
              :options="tecnicoOptions"
              placeholder="Selecione os técnicos"
              search-placeholder="Buscar técnico..."
              singular-label="técnico"
              plural-label="técnicos"
            />
          </div>

          <div v-if="submitError" class="nd-field-error col-span-full">{{ submitError }}</div>

          <DialogFooter class="col-span-full">
            <button
              v-if="internalMode === 'edicao'"
              type="button"
              class="nd-btn-secondary"
              @click="switchToDetalhe"
            >CANCELAR</button>
            <DialogClose v-else as-child>
              <button type="button" class="nd-btn-secondary">CANCELAR</button>
            </DialogClose>

            <button type="submit" class="nd-btn-primary" :disabled="submitting">
              {{ internalMode === 'edicao' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR' }}
            </button>
          </DialogFooter>
        </form>
      </template>

    </DialogContent>
  </Dialog>
</template>

<style scoped>
.nd-detail-tipo {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--nd-text-secondary);
}

.nd-detail-value--mono {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.nd-detail-value--dim {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  color: var(--nd-text-disabled);
}

.nd-detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.nd-detail-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  color: var(--nd-text-primary);
}

.nd-detail-list-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--nd-action);
  flex-shrink: 0;
}
</style>
