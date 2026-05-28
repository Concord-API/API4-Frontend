<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AgendaPage from './AgendaPage.vue'
import { Pencil, Plus, Search } from 'lucide-vue-next'
import { manutencaoService, type ManutencaoAPI, type ManutencaoStatus } from '@/shared/services/manutencaoService'
import { contratoService, type ContratoAPI } from '@/shared/services/contratoService'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { getApiErrorMessage } from '@/shared/services/api'
import ViewToggle from '@/shared/components/ui/ViewToggle.vue'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'
import NdDateRangePicker, { type DateRange } from '@/shared/components/ui/NdDateRangePicker.vue'
import GeocodedAddress from '@/shared/components/ui/GeocodedAddress.vue'
import CalendarioModal from '@/features/dashboard/components/CalendarioModal.vue'
import MaintenanceIssueModal from '@/features/dashboard/components/maintenance-issue/MaintenanceIssueModal.vue'
import { useAuth } from '@/shared/composables/useAuth'

const activeTab = ref<'agenda' | 'manutencoes'>('agenda')
const manutencoes = ref<ManutencaoAPI[]>([])
const contratos = ref<ContratoAPI[]>([])
const tecnicos = ref<TecnicoAPI[]>([])
const searchQuery = ref('')
const activeFilter = ref<'todas' | ManutencaoStatus>('todas')
const filterTecnico = ref<number | null>(null)
const filterContrato = ref<number | null>(null)
const filterDate = ref<DateRange | null>(null)
const viewMode = ref<'table' | 'grid'>('table')
const loading = ref(false)
const submitError = ref<string | null>(null)
const createOpen = ref(false)
const detailOpen = ref(false)
const detailItem = ref<ManutencaoAPI | null>(null)
const { currentUser } = useAuth()
const isTechnician = computed(() => String(currentUser.value?.role ?? '').toLowerCase() === 'technician')

function openCreate() {
  detailOpen.value = false
  detailItem.value = null
  createOpen.value = true
}

function openDetail(manutencao: ManutencaoAPI) {
  detailItem.value = manutencao
  detailOpen.value = true
}

function openEdit(manutencao: ManutencaoAPI) {
  openDetail(manutencao)
}

const counts = computed(() => ({
  scheduled: manutencoes.value.filter(m => m.status === 'SCHEDULED').length,
  started: manutencoes.value.filter(m => m.status === 'STARTED').length,
  completed: manutencoes.value.filter(m => m.status === 'COMPLETED').length,
}))

const totalSegments = computed(() => Math.max(manutencoes.value.length, 1))

function segmentsFor(count: number) {
  return Math.min(count, totalSegments.value)
}

const filteredManutencoes = computed(() => {
  let result = manutencoes.value
  if (activeFilter.value !== 'todas') result = result.filter(m => m.status === activeFilter.value)
  if (filterTecnico.value) result = result.filter(m => m.employees.some(e => e.employeeId === filterTecnico.value))
  if (filterContrato.value) result = result.filter(m => m.contract.id === filterContrato.value)
  if (filterDate.value) {
    const { start, end } = filterDate.value
    if (start) result = result.filter(m => m.date >= start)
    if (end) result = result.filter(m => m.date <= end)
  }
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
  if (status === 'COMPLETED') return 'Concluida'
  if (status === 'STARTED') return 'Em andamento'
  return 'Programada'
}

function formatDate(dateStr: string) {
  const [year = '', month = '', day = ''] = dateStr.split('-')
  return `${day}/${month}/${year.slice(2)}`
}

const tecnicoOptions = computed(() =>
  tecnicos.value.filter(t => t.active).map(t => ({ value: t.employeeId, label: t.name })),
)

const filters = [
  { key: 'todas', label: 'Todas' },
  { key: 'SCHEDULED', label: 'Programadas' },
  { key: 'STARTED', label: 'Em andamento' },
  { key: 'COMPLETED', label: 'Concluidas' },
] as const

const filterOptions = filters.map(f => ({ value: f.key, label: f.label }))
const filterValue = computed({
  get: () => activeFilter.value as string | number,
  set: value => { activeFilter.value = (value ?? 'todas') as typeof activeFilter.value },
})

const filterTecnicoOptions = computed(() => [
  { value: -1, label: 'Todos os tecnicos' },
  ...tecnicoOptions.value,
])

const filterTecnicoValue = computed({
  get: () => filterTecnico.value ?? -1,
  set: value => { filterTecnico.value = value === -1 ? null : (value as number) },
})

const filterContratoOptions = computed(() => [
  { value: -1, label: 'Todos os contratos' },
  ...contratos.value.map(c => ({ value: c.id, label: `#${String(c.id).padStart(3, '0')} - ${c.client.name}` })),
])

const filterContratoValue = computed({
  get: () => filterContrato.value ?? -1,
  set: value => { filterContrato.value = value === -1 ? null : (value as number) },
})

async function carregarDados() {
  loading.value = true
  submitError.value = null

  try {
    const [manutencoesResponse, contratosResponse, tecnicosResponse] = await Promise.all([
      manutencaoService.listar(),
      contratoService.listar(),
      tecnicoService.listar(),
    ])

    manutencoes.value = manutencoesResponse
    contratos.value = contratosResponse
    tecnicos.value = tecnicosResponse
  } catch (error) {
    submitError.value = getApiErrorMessage(error, 'Nao foi possivel carregar os dados.')
  } finally {
    loading.value = false
  }
}

async function handleSaved() {
  const selectedId = detailItem.value?.id
  await carregarDados()

  if (!selectedId) return
  const updated = manutencoes.value.find(m => m.id === selectedId)
  if (updated) {
    detailItem.value = updated
    return
  }

  detailItem.value = null
  detailOpen.value = false
}

onMounted(carregarDados)
</script>

<template>
  <div class="nd-page">
    <nav class="manutencoes-nav">
      <button class="manutencoes-tab" :class="{ 'manutencoes-tab--active': activeTab === 'agenda' }" @click="activeTab = 'agenda'">
        Agenda
      </button>
      <button class="manutencoes-tab" :class="{ 'manutencoes-tab--active': activeTab === 'manutencoes' }" @click="activeTab = 'manutencoes'">
        Manutencoes
      </button>
    </nav>

    <template v-if="activeTab === 'manutencoes'">
      <CalendarioModal
        v-model:open="createOpen"
        @saved="handleSaved"
      />

      <MaintenanceIssueModal
        v-model:open="detailOpen"
        :manutencao="detailItem"
        :can-edit="!isTechnician"
        @saved="handleSaved"
      />

      <div v-if="submitError" class="nd-error">{{ submitError }}</div>

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
          <span class="nd-label">Concluidas</span>
        </div>
        <button class="nd-btn-primary nd-btn-desktop" style="margin-left: auto" @click="openCreate">
          <Plus :size="12" /> Nova manutencao
        </button>
      </div>

      <button class="nd-fab" @click="openCreate" aria-label="Nova manutencao">
        <Plus :size="20" />
      </button>

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
          <div class="nd-progress-label-col"><span class="nd-label">Concluidas</span><span class="nd-label nd-label--dim">{{ counts.completed }}</span></div>
          <div class="nd-progress-bar">
            <div v-for="i in totalSegments" :key="i" class="nd-segment" :style="{ background: i <= segmentsFor(counts.completed) ? 'var(--nd-success)' : 'var(--nd-border)' }" />
          </div>
        </div>
      </div>

      <div class="nd-controls-row">
        <div class="nd-controls-left">
          <div class="nd-filter-select">
            <NdCombobox v-model="filterValue" :options="filterOptions" placeholder="Status" :search-placeholder="''" />
          </div>
          <div class="nd-filter-select">
            <NdCombobox v-model="filterTecnicoValue" :options="filterTecnicoOptions" placeholder="Tecnico" search-placeholder="Buscar tecnico..." />
          </div>
          <div class="nd-filter-select">
            <NdCombobox v-model="filterContratoValue" :options="filterContratoOptions" placeholder="Contrato" search-placeholder="Buscar contrato..." />
          </div>
          <NdDateRangePicker v-model="filterDate" />
        </div>
        <div class="nd-controls-right">
          <div class="nd-search">
            <Search :size="13" class="nd-search-icon" />
            <input v-model="searchQuery" type="text" placeholder="Buscar..." class="nd-search-input" />
          </div>
          <ViewToggle v-model="viewMode" />
        </div>
      </div>

      <div v-if="viewMode === 'table'" class="nd-table-wrap">
        <table class="nd-table">
          <colgroup>
            <col class="nd-col--data"><col><col class="nd-col--tipo"><col class="nd-col--count"><col class="nd-col--status"><col style="width:44px">
          </colgroup>
          <thead>
            <tr>
              <th class="nd-th">Data</th>
              <th class="nd-th">Cliente</th>
              <th class="nd-th">Tipo</th>
              <th class="nd-th nd-th--center">Tecnicos</th>
              <th class="nd-th nd-th--status">Status</th>
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
            <tr v-if="!loading && filteredManutencoes.length === 0"><td colspan="6" class="nd-empty">Nenhuma manutencao cadastrada</td></tr>
          </tbody>
        </table>
      </div>

      <div v-else class="nd-grid">
        <div v-if="loading" class="nd-empty nd-empty--grid">Carregando...</div>
        <div v-for="m in filteredManutencoes" :key="m.id" class="nd-card" @click="openDetail(m)">
          <div class="nd-card-top">
            <span class="nd-card-date">{{ formatDate(m.date) }}</span>
            <button class="nd-card-edit-btn" type="button" @click.stop="openEdit(m)"><Pencil :size="11" /></button>
          </div>
          <p class="nd-card-name">{{ m.contract.client.name }}</p>
          <GeocodedAddress :lat="m.latitude" :lng="m.longitude" />
          <span class="nd-card-tipo">{{ m.type }}</span>
          <span class="nd-card-tecnicos">{{ m.employees.length }} tecnico{{ m.employees.length !== 1 ? 's' : '' }}</span>
          <div class="nd-card-footer">
            <span class="nd-tag" :style="{ color: statusColor(m.status), borderColor: statusColor(m.status) }">{{ statusLabel(m.status) }}</span>
          </div>
        </div>
        <div v-if="!loading && filteredManutencoes.length === 0" class="nd-empty nd-empty--grid">Nenhuma manutencao cadastrada</div>
      </div>
    </template>

    <AgendaPage v-else />
  </div>
</template>

<style scoped>
.manutencoes-nav { display: flex; justify-content: center; margin-top: -1.5rem; margin-bottom: 1.5rem; }
@media (min-width: 640px) { .manutencoes-nav { margin-top: -2rem; margin-bottom: 2rem; } }
@media (min-width: 768px) { .manutencoes-nav { margin-top: -2.5rem; margin-bottom: 2.5rem; } }
@media (min-width: 1024px) { .manutencoes-nav { margin-top: -3rem; margin-bottom: 3rem; } }
.manutencoes-tab { font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; color: var(--nd-text-disabled); background: transparent; border: none; border-bottom: 2px solid var(--nd-border); padding: 10px 20px; margin-bottom: -1px; cursor: pointer; transition: color 150ms ease-out, border-color 150ms ease-out; }
.manutencoes-tab:hover { color: var(--nd-text-primary); }
.manutencoes-tab--active { color: var(--nd-text-display); border-bottom-color: var(--nd-sidebar-active-color); }
.nd-page { display: flex; flex-direction: column; gap: 0; min-height: 100%; }
.nd-error { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-accent); margin-bottom: 16px; }
.nd-label { font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.01em; color: var(--nd-text-secondary); line-height: 1.2; }
.nd-label--dim { color: var(--nd-text-disabled); }
.nd-stats-row { display: flex; align-items: center; gap: 24px; padding: 20px 0; border-top: 1px solid var(--nd-border); border-bottom: 1px solid var(--nd-border); margin-bottom: 28px; }
.nd-stat { display: flex; flex-direction: column; gap: 4px; }
.nd-stat-val { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; color: var(--nd-text-display); line-height: 1.1; }
.nd-stat-sep { width: 1px; height: 28px; background: var(--nd-border-visible); }
.nd-progress-section { display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; padding: 20px 0; border-bottom: 1px solid var(--nd-border); }
.nd-progress-row { display: flex; align-items: center; gap: 16px; }
.nd-progress-label-col { display: flex; gap: 8px; align-items: baseline; min-width: 150px; }
.nd-progress-bar { flex: 1; display: flex; gap: 2px; height: 8px; }
.nd-segment { flex: 1; height: 100%; }
.nd-controls-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
.nd-controls-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex: 1; }
.nd-controls-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
.nd-filter-select { width: 160px; flex-shrink: 0; }
.nd-search { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--nd-border-visible); padding-bottom: 6px; }
.nd-search-icon { color: var(--nd-text-disabled); }
.nd-search-input { background: transparent; border: none; outline: none; font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.01em; color: var(--nd-text-primary); width: 180px; }
.nd-search-input::placeholder { color: var(--nd-text-disabled); }
.nd-col--data { width: 88px; }
.nd-col--tipo { width: 110px; }
.nd-col--count { width: 72px; }
.nd-col--status { width: 160px; }
.nd-table-wrap { overflow-x: auto; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-th { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--nd-text-secondary); text-align: left; padding: 0 16px 10px 0; border-bottom: 1px solid var(--nd-border-visible); white-space: nowrap; }
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
.nd-tag { display: inline-flex; align-items: center; justify-content: center; min-height: 24px; padding: 0 10px; border: 1px solid; border-radius: 999px; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.nd-btn-primary { display: flex; align-items: center; gap: 6px; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; background: var(--nd-action); color: var(--nd-action-foreground); border: none; border-radius: 999px; padding: 8px 16px; cursor: pointer; transition: background-color 150ms ease-out; }
.nd-btn-primary:hover { background: var(--nd-action-hover); }
.nd-fab { display: none; }

@media (max-width: 640px) {
  .nd-controls-row { flex-direction: column; align-items: stretch; gap: 12px; }
  .nd-controls-left { flex-direction: column; align-items: stretch; }
  .nd-controls-right { justify-content: space-between; }
  .nd-filter-select { width: 100%; }
  .nd-search { flex: 1; }
  .nd-search-input { width: 100%; min-width: 0; }
  .nd-grid { grid-template-columns: 1fr; }
  .nd-progress-label-col { min-width: 110px; }
  .nd-btn-desktop { display: none; }
  .nd-fab {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--nd-action);
    color: var(--nd-action-foreground);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    transition: background-color 150ms ease-out;
    z-index: 50;
  }
  .nd-fab:hover { background: var(--nd-action-hover); }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .nd-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
