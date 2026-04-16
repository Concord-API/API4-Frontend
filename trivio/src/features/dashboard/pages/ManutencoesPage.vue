<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Plus, Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { manutencaoService, type ManutencaoAPI, type ManutencaoStatus, type ManutencaoTipo } from '@/shared/services/manutencaoService'
import { contratoService, type ContratoAPI } from '@/shared/services/contratoService'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import ViewToggle from '@/shared/components/ui/ViewToggle.vue'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'
import NdMultiCombobox from '@/shared/components/ui/NdMultiCombobox.vue'

const detailOpen = ref(false)
const detailItem = ref<ManutencaoAPI | null>(null)

function openDetail(m: ManutencaoAPI) {
  detailItem.value = m
  detailOpen.value = true
}

function openEditFromDetail() {
  if (!detailItem.value) return
  const m = detailItem.value
  detailOpen.value = false
  openEdit(m)
}

const manutencoes = ref<ManutencaoAPI[]>([])
const contratos = ref<ContratoAPI[]>([])
const tecnicos = ref<TecnicoAPI[]>([])
const searchQuery = ref('')
const activeFilter = ref<'todas' | ManutencaoStatus>('todas')
const viewMode = ref<'table' | 'grid'>('table')
const sheetOpen = ref(false)
const sheetMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const loading = ref(false)
const submitError = ref<string | null>(null)

const defaultForm = () => ({
  contractId: 0,
  date: '',
  type: 'PREVENTIVA' as ManutencaoTipo,
  status: 'SCHEDULED' as ManutencaoStatus,
  employeeIds: [] as number[],
})

const form = ref(defaultForm())

const preventiveFromType = computed(() => form.value.type === 'PREVENTIVA')

function openCreate() {
  form.value = defaultForm(); editingId.value = null; sheetMode.value = 'create'; sheetOpen.value = true
}

function openEdit(m: ManutencaoAPI) {
  form.value = {
    contractId: m.contract.id,
    date: m.date,
    type: m.type,
    status: m.status,
    employeeIds: m.employees.map(e => e.employeeId),
  }
  editingId.value = m.id; sheetMode.value = 'edit'; sheetOpen.value = true
}

watch(sheetOpen, open => {
  if (!open) { form.value = defaultForm(); editingId.value = null; submitError.value = null }
})

const counts = computed(() => ({
  scheduled: manutencoes.value.filter(m => m.status === 'SCHEDULED').length,
  started: manutencoes.value.filter(m => m.status === 'STARTED').length,
  completed: manutencoes.value.filter(m => m.status === 'COMPLETED').length,
}))

const totalSegments = computed(() => Math.max(manutencoes.value.length, 1))
function segmentsFor(count: number) { return Math.min(count, totalSegments.value) }

const filteredManutencoes = computed(() => {
  let result = manutencoes.value
  if (activeFilter.value !== 'todas') result = result.filter(m => m.status === activeFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(m =>
      m.contract.client.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q),
    )
  }
  return result
})

function statusColor(status: ManutencaoStatus) {
  if (status === 'COMPLETED') return 'var(--nd-success)'
  if (status === 'STARTED') return 'var(--nd-warning)'
  return 'var(--nd-text-secondary)'
}

function statusLabel(status: ManutencaoStatus) {
  if (status === 'COMPLETED') return 'CONCLUÍDA'
  if (status === 'STARTED') return 'Em andamento'
  return 'Programada'
}

function formatDate(dateStr: string) {
  const [y = '', m = '', d = ''] = dateStr.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

const tecnicoOptions = computed(() =>
  tecnicos.value.filter(t => t.active).map(t => ({ value: t.employeeId, label: t.name })),
)

async function carregarDados() {
  loading.value = true; submitError.value = null
  try {
    const [m, c, t] = await Promise.all([
      manutencaoService.listar(), contratoService.listar(), tecnicoService.listar(),
    ])
    manutencoes.value = m; contratos.value = c; tecnicos.value = t
  } catch (error) {
    submitError.value = getApiErrorMessage(error, 'Não foi possível carregar os dados.')
  } finally { loading.value = false }
}

async function submitForm() {
  if (!form.value.contractId) { toast.error('Selecione um contrato.'); return }
  submitError.value = null
  const payload = {
    contractId: form.value.contractId,
    date: form.value.date,
    preventive: preventiveFromType.value,
    type: form.value.type,
    status: form.value.status,
    employeeIds: form.value.employeeIds,
  }
  try {
    if (sheetMode.value === 'edit' && editingId.value) {
      await manutencaoService.atualizar(editingId.value, payload)
      toast.success('Manutenção atualizada.')
    } else {
      await manutencaoService.criar(payload)
      toast.success('Manutenção cadastrada com sucesso.')
    }
    sheetOpen.value = false
    await carregarDados()
  } catch (error) {
    const msg = getApiErrorMessage(error, 'Não foi possível salvar a manutenção.')
    submitError.value = msg; toast.error(msg)
  }
}

const filters = [
  { key: 'todas', label: 'Todas' },
  { key: 'SCHEDULED', label: 'Programadas' },
  { key: 'STARTED', label: 'Em andamento' },
  { key: 'COMPLETED', label: 'CONCLUÍDAS' },
] as const

const filterOptions = filters.map(f => ({ value: f.key, label: f.label }))
const filterValue = computed({
  get: () => activeFilter.value as string | number,
  set: (v) => { activeFilter.value = (v ?? 'todas') as typeof activeFilter.value },
})

const contratoOptions = computed(() =>
  contratos.value.map(c => ({ value: c.id, label: `#${String(c.id).padStart(3, '0')} — ${c.client.name}` })),
)

const tipoOptions = [
  { value: 'PREVENTIVA', label: 'Preventiva' },
  { value: 'CORRETIVA', label: 'Corretiva' },
  { value: 'MELHORIA', label: 'Melhoria' },
]

const statusOptions = [
  { value: 'SCHEDULED', label: 'Programada' },
  { value: 'STARTED', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'CONCLUÍDA' },
]

onMounted(carregarDados)
</script>

<template>
  <div class="nd-page">

    <div class="nd-action-row">
      <button class="nd-btn-primary" @click="openCreate">
        <Plus :size="12" /> NOVA MANUTENÇÃO
      </button>
    </div>

    <Sheet v-model:open="sheetOpen">
      <SheetContent class="nd-sheet">
        <SheetHeader class="nd-sheet-header">
          <SheetTitle class="nd-sheet-title">{{ sheetMode === 'edit' ? 'EDITAR MANUTENÇÃO' : 'NOVA MANUTENÇÃO' }}</SheetTitle>
          <SheetDescription class="sr-only">{{ sheetMode === 'edit' ? 'Editar manutenção' : 'Nova manutenção' }}</SheetDescription>
        </SheetHeader>
        <form class="nd-form" @submit.prevent="submitForm">
          <div class="nd-field">
            <label class="nd-field-label">Contrato *</label>
            <NdCombobox v-model="form.contractId" :options="contratoOptions" placeholder="Selecione o contrato" search-placeholder="Buscar contrato..." />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">Data *</label>
            <input v-model="form.date" type="date" class="nd-field-input" required />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">Tipo *</label>
            <NdCombobox v-model="form.type" :options="tipoOptions" placeholder="Selecione o tipo" />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">Status *</label>
            <NdCombobox v-model="form.status" :options="statusOptions" placeholder="Selecione o status" />
          </div>
          <div class="nd-field">
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
          <div v-if="submitError" class="nd-field-error">{{ submitError }}</div>
          <div class="nd-form-footer">
            <button type="submit" class="nd-btn-primary nd-btn-full">
              {{ sheetMode === 'edit' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR MANUTENÇÃO' }}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <!-- DETAIL SHEET -->
    <Sheet v-model:open="detailOpen">
      <SheetContent class="nd-sheet nd-sheet--detail">
        <SheetHeader class="nd-sheet-header">
          <SheetTitle class="nd-sheet-title">DETALHES DA MANUTENÇÃO</SheetTitle>
          <SheetDescription class="sr-only">Detalhes da manutenção</SheetDescription>
        </SheetHeader>
        <div v-if="detailItem" class="nd-detail">
          <div class="nd-detail-status-row">
            <span class="nd-tag nd-tag--lg" :style="{ color: statusColor(detailItem.status), borderColor: statusColor(detailItem.status) }">
              {{ statusLabel(detailItem.status) }}
            </span>
            <span class="nd-detail-tipo">{{ detailItem.type }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Data</span>
            <span class="nd-detail-value nd-detail-value--mono">{{ formatDate(detailItem.date) }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Contrato</span>
            <span class="nd-detail-value">#{{ String(detailItem.contract.id).padStart(3, '0') }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Cliente</span>
            <span class="nd-detail-value">{{ detailItem.contract.client.name }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">TÉCNICOS ({{ detailItem.employees.length }})</span>
            <div v-if="detailItem.employees.length" class="nd-detail-list">
              <div v-for="emp in detailItem.employees" :key="emp.employeeId" class="nd-detail-list-item">
                <span class="nd-detail-list-dot" />
                {{ emp.name }}
              </div>
            </div>
            <span v-else class="nd-detail-value nd-detail-value--dim">Nenhum técnico alocado</span>
          </div>

          <div class="nd-detail-footer">
            <button class="nd-btn-primary nd-btn-full" type="button" @click="openEditFromDetail">
              <Pencil :size="12" /> EDITAR MANUTENÇÃO
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <div v-if="submitError && !sheetOpen" class="nd-error">{{ submitError }}</div>

    <div class="nd-hero">
      <div class="nd-hero-row">
        <div class="nd-hero-number nd-hero-number--accent">
          {{ String(counts.scheduled + counts.started).padStart(2, '0') }}
        </div>
        <div class="nd-hero-aside">
          <span class="nd-label" style="color: var(--nd-warning)">Programadas / Em andamento</span>
          <span class="nd-label nd-label--dim">REQUEREM ATENÇÃO</span>
        </div>
      </div>
    </div>

    <div class="nd-stats-row">
      <div class="nd-stat">
        <span class="nd-stat-val">{{ counts.scheduled }}</span>
        <span class="nd-label">Programadas</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-warning)">{{ counts.started }}</span>
        <span class="nd-label">Em andamento</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-success)">{{ counts.completed }}</span>
        <span class="nd-label">CONCLUÍDAS</span>
      </div>
    </div>

    <div class="nd-progress-section">
      <div class="nd-progress-row">
        <div class="nd-progress-label-col"><span class="nd-label">Programadas</span><span class="nd-label nd-label--dim">{{ counts.scheduled }}</span></div>
        <div class="nd-progress-bar">
          <div v-for="i in totalSegments" :key="i" class="nd-segment" :style="{ background: i <= segmentsFor(counts.scheduled) ? 'var(--nd-text-secondary)' : 'var(--nd-border)' }" />
        </div>
      </div>
      <div class="nd-progress-row">
        <div class="nd-progress-label-col"><span class="nd-label">Em andamento</span><span class="nd-label nd-label--dim">{{ counts.started }}</span></div>
        <div class="nd-progress-bar">
          <div v-for="i in totalSegments" :key="i" class="nd-segment" :style="{ background: i <= segmentsFor(counts.started) ? 'var(--nd-warning)' : 'var(--nd-border)' }" />
        </div>
      </div>
      <div class="nd-progress-row">
        <div class="nd-progress-label-col"><span class="nd-label">CONCLUÍDAS</span><span class="nd-label nd-label--dim">{{ counts.completed }}</span></div>
        <div class="nd-progress-bar">
          <div v-for="i in totalSegments" :key="i" class="nd-segment" :style="{ background: i <= segmentsFor(counts.completed) ? 'var(--nd-success)' : 'var(--nd-border)' }" />
        </div>
      </div>
    </div>

    <div class="nd-controls-row">
      <div class="nd-filter-select">
        <NdCombobox v-model="filterValue" :options="filterOptions" placeholder="Filtrar" :search-placeholder="''" />
      </div>
      <div class="nd-controls-right">
        <div class="nd-search">
          <Search :size="13" class="nd-search-icon" />
          <input v-model="searchQuery" type="text" placeholder="Buscar..." class="nd-search-input" />
        </div>
        <ViewToggle v-model="viewMode" />
      </div>
    </div>

    <!-- TABLE VIEW -->
    <div v-if="viewMode === 'table'" class="nd-table-wrap">
      <table class="nd-table">
        <colgroup>
          <col class="nd-col--data"><col><col class="nd-col--tipo"><col class="nd-col--count"><col class="nd-col--status"><col style="width:44px">
        </colgroup>
        <thead>
          <tr>
            <th class="nd-th">DATA</th>
            <th class="nd-th">CLIENTE</th>
            <th class="nd-th">TIPO</th>
            <th class="nd-th nd-th--center">TÉCNICOS</th>
            <th class="nd-th nd-th--status">STATUS</th>
            <th class="nd-th" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="nd-empty">Carregando...</td></tr>
          <tr v-for="m in filteredManutencoes" :key="m.id" class="nd-tr nd-tr--clickable" @click="openDetail(m)">
            <td class="nd-td nd-td--mono">{{ formatDate(m.date) }}</td>
            <td class="nd-td nd-td--primary">{{ m.contract.client.name }}</td>
            <td class="nd-td nd-td--secondary">{{ m.type }}</td>
            <td class="nd-td nd-td--mono nd-td--center">{{ String(m.employees.length).padStart(2, '0') }}</td>
            <td class="nd-td nd-td--status">
              <span class="nd-tag" :style="{ color: statusColor(m.status), borderColor: statusColor(m.status) }">{{ statusLabel(m.status) }}</span>
            </td>
            <td class="nd-td nd-td--action">
              <button class="nd-edit-btn" type="button" @click.stop="openEdit(m)"><Pencil :size="12" /></button>
            </td>
          </tr>
          <tr v-if="!loading && filteredManutencoes.length === 0"><td colspan="6" class="nd-empty">NENHUMA MANUTENÇÃO CADASTRADA</td></tr>
        </tbody>
      </table>
    </div>

    <!-- GRID VIEW -->
    <div v-else class="nd-grid">
      <div v-if="loading" class="nd-empty nd-empty--grid">Carregando...</div>
      <div v-for="m in filteredManutencoes" :key="m.id" class="nd-card" @click="openDetail(m)">
        <div class="nd-card-top">
          <span class="nd-card-date">{{ formatDate(m.date) }}</span>
          <button class="nd-card-edit-btn" type="button" @click.stop="openEdit(m)"><Pencil :size="11" /></button>
        </div>
        <p class="nd-card-name">{{ m.contract.client.name }}</p>
        <span class="nd-card-tipo">{{ m.type }}</span>
        <span class="nd-card-tecnicos">{{ m.employees.length }} TÉCNICO{{ m.employees.length !== 1 ? 's' : '' }}</span>
        <div class="nd-card-footer">
          <span class="nd-tag" :style="{ color: statusColor(m.status), borderColor: statusColor(m.status) }">{{ statusLabel(m.status) }}</span>
        </div>
      </div>
      <div v-if="!loading && filteredManutencoes.length === 0" class="nd-empty nd-empty--grid">NENHUMA MANUTENÇÃO CADASTRADA</div>
    </div>

  </div>
</template>

<style scoped>
.nd-page { display: flex; flex-direction: column; gap: 0; min-height: 100%; }
.nd-action-row { display: flex; justify-content: flex-end; margin-bottom: 40px; }
.nd-error { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-accent); margin-bottom: 16px; }
.nd-label { font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.01em; font-weight: 500; color: var(--nd-text-secondary); line-height: 1.2; }
.nd-label--dim { color: var(--nd-text-disabled); }
.nd-hero { margin-bottom: 32px; }
.nd-hero-row { display: flex; align-items: flex-end; gap: 20px; }
.nd-hero-number { font-family: 'Montserrat', sans-serif; font-size: 80px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.0; color: var(--nd-text-display); }
.nd-hero-number--accent { color: var(--nd-warning); }
.nd-hero-aside { display: flex; flex-direction: column; gap: 4px; padding-bottom: 10px; }
.nd-stats-row { display: flex; align-items: center; gap: 24px; padding: 20px 0; border-top: 1px solid var(--nd-border); border-bottom: 1px solid var(--nd-border); margin-bottom: 28px; }
.nd-stat { display: flex; flex-direction: column; gap: 4px; }
.nd-stat-val { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; color: var(--nd-text-display); line-height: 1.1; }
.nd-stat-sep { width: 1px; height: 28px; background: var(--nd-border-visible); }
.nd-progress-section { display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; padding: 20px 0; border-bottom: 1px solid var(--nd-border); }
.nd-progress-row { display: flex; align-items: center; gap: 16px; }
.nd-progress-label-col { display: flex; gap: 8px; align-items: baseline; min-width: 150px; }
.nd-progress-bar { flex: 1; display: flex; gap: 2px; height: 8px; }
.nd-segment { flex: 1; height: 100%; }
.nd-controls-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; }
.nd-controls-right { display: flex; align-items: center; gap: 16px; }
.nd-filter-select { width: 160px; flex-shrink: 0; }
.nd-search { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--nd-border-visible); padding-bottom: 6px; }
.nd-search-icon { color: var(--nd-text-disabled); }
.nd-search-input { background: transparent; border: none; outline: none; font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.01em; color: var(--nd-text-primary); width: 180px; }
.nd-search-input::placeholder { color: var(--nd-text-disabled); }
.nd-col--data { width: 88px; } .nd-col--tipo { width: 110px; } .nd-col--count { width: 72px; } .nd-col--status { width: 160px; }
.nd-table-wrap { overflow-x: auto; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-th { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 700; color: var(--nd-text-secondary); text-align: left; padding: 0 16px 10px 0; border-bottom: 1px solid var(--nd-border-visible); white-space: nowrap; }
.nd-th--center { text-align: center; padding-right: 16px; }
.nd-th--status { padding-left: 20px; padding-right: 0; }
.nd-tr { border-bottom: 1px solid var(--nd-border); transition: background 150ms ease-out; }
.nd-tr:hover { background: var(--nd-surface); }
.nd-tr:hover .nd-edit-btn { opacity: 1; }
.nd-tr--clickable { cursor: pointer; }
.nd-td { padding: 13px 16px 13px 0; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-secondary); vertical-align: middle; }
.nd-td--primary { color: var(--nd-text-primary); }
.nd-td--secondary { color: var(--nd-text-secondary); }
.nd-td--mono { font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.02em; }
.nd-td--center { text-align: center; padding-right: 16px; }
.nd-td--status { padding-left: 20px; padding-right: 0; }
.nd-td--action { padding-right: 0; width: 44px; }
.nd-edit-btn { opacity: 0; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 6px; cursor: pointer; color: var(--nd-text-secondary); transition: opacity 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out; }
.nd-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-tag { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 8px; border: 1px solid; border-radius: 999px; white-space: nowrap; }
.nd-empty { padding: 48px 0; font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-text-disabled); text-align: center; }
.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.nd-empty--grid { grid-column: 1 / -1; }
.nd-card { background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color 150ms ease-out; display: flex; flex-direction: column; gap: 4px; }
.nd-card:hover { border-color: var(--nd-border-visible); }
.nd-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.nd-card-date { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.04em; color: var(--nd-text-disabled); }
.nd-card-tipo { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-secondary); }
.nd-card-name { font-family: 'Montserrat', sans-serif; font-size: 15px; color: var(--nd-text-primary); margin: 2px 0; line-height: 1.3; flex: 1; }
.nd-card-tecnicos { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-disabled); }
.nd-card-footer { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--nd-border); }
.nd-card-edit-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 6px; cursor: pointer; color: var(--nd-text-secondary); transition: color 150ms ease-out, border-color 150ms ease-out; }
.nd-card-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
/* Detail sheet */
:deep(.nd-sheet--detail) { background: var(--nd-surface) !important; border-left: 1px solid var(--nd-border-visible) !important; padding: 32px 28px; }
.nd-detail { display: flex; flex-direction: column; gap: 28px; }
.nd-detail-status-row { display: flex; align-items: center; gap: 12px; padding-bottom: 20px; border-bottom: 1px solid var(--nd-border); }
.nd-tag--lg { font-size: 11px; padding: 4px 12px; }
.nd-detail-tipo { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-secondary); }
.nd-detail-section { display: flex; flex-direction: column; gap: 8px; }
.nd-detail-value { font-family: 'Montserrat', sans-serif; font-size: 16px; color: var(--nd-text-primary); }
.nd-detail-value--mono { font-family: 'Montserrat', sans-serif; font-size: 14px; letter-spacing: 0.04em; }
.nd-detail-value--dim { font-family: 'Montserrat', sans-serif; font-size: 11px; color: var(--nd-text-disabled); }
.nd-detail-list { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
.nd-detail-list-item { display: flex; align-items: center; gap: 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-primary); }
.nd-detail-list-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--nd-action); flex-shrink: 0; }
.nd-detail-footer { margin-top: auto; padding-top: 20px; border-top: 1px solid var(--nd-border); }
:deep(.nd-sheet) { background: var(--nd-surface) !important; border-left: 1px solid var(--nd-border-visible) !important; padding: 32px 28px; }
.nd-sheet-header { margin-bottom: 32px; }
.nd-sheet-title { font-family: 'Montserrat', sans-serif !important; font-size: 13px !important; font-weight: 600 !important; letter-spacing: 0 !important; color: var(--nd-text-display) !important; }
.nd-form { display: flex; flex-direction: column; gap: 24px; }
.nd-field { display: flex; flex-direction: column; gap: 8px; }
.nd-field-label { font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.03em; color: var(--nd-text-disabled); }
.nd-field-hint { font-family: 'Montserrat', sans-serif; font-size: 10px; letter-spacing: 0.06em; color: var(--nd-text-disabled); }
.nd-field-input { background: transparent; border: none; border-bottom: 1px solid var(--nd-border-visible); outline: none; padding: 8px 0; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-primary); transition: border-color 150ms ease-out; width: 100%; }
.nd-field-input:focus { border-bottom-color: var(--nd-text-primary); }
.nd-field-select { font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.01em; cursor: pointer; }
.nd-field-error { font-family: 'Montserrat', sans-serif; font-size: 10px; letter-spacing: 0.06em; color: var(--nd-accent); }
.nd-check-list { display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; padding: 8px 0; }
.nd-check-item { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 0; }
.nd-check { accent-color: var(--nd-action); width: 14px; height: 14px; flex-shrink: 0; cursor: pointer; }
.nd-check-name { font-family: 'Montserrat', sans-serif; font-size: 13px; color: var(--nd-text-primary); }
.nd-btn-primary { display: flex; align-items: center; gap: 6px; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; background: var(--nd-action); color: var(--nd-action-foreground); border: none; border-radius: 999px; padding: 8px 16px; cursor: pointer; transition: background-color 150ms ease-out; }
.nd-btn-primary:hover { background: var(--nd-action-hover); }
.nd-btn-full { width: 100%; justify-content: center; }
.nd-form-footer { margin-top: 16px; }

@media (max-width: 640px) {
  .nd-controls-row { flex-direction: column; align-items: stretch; gap: 12px; }
  .nd-controls-right { justify-content: space-between; }
  .nd-filter-select { width: 100%; }
  .nd-search { flex: 1; }
  .nd-search-input { width: 100%; min-width: 0; }
  .nd-grid { grid-template-columns: 1fr; }
  .nd-hero-number { font-size: 56px; }
  .nd-progress-label-col { min-width: 110px; }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .nd-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
