<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AgendaPage from './AgendaPage.vue'
import { Search } from 'lucide-vue-next'
import { manutencaoService, type ManutencaoAPI, type ManutencaoStatus } from '@/shared/services/manutencaoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { useAuth } from '@/shared/composables/useAuth'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import ViewToggle from '@/shared/components/ui/ViewToggle.vue'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'
import GeocodedAddress from '@/shared/components/ui/GeocodedAddress.vue'
import NdDateRangePicker, { type DateRange } from '@/shared/components/ui/NdDateRangePicker.vue'

const activeTab = ref<'agenda' | 'manutencoes'>('agenda')

const detailOpen = ref(false)
const detailItem = ref<ManutencaoAPI | null>(null)

function openDetail(m: ManutencaoAPI) {
  detailItem.value = m
  detailOpen.value = true
}

const manutencoes = ref<ManutencaoAPI[]>([])
const searchQuery = ref('')
const activeFilter = ref<'todas' | ManutencaoStatus>('todas')
const filterContrato = ref<number | null>(null)
const filterDate = ref<DateRange | null>(null)
const viewMode = ref<'table' | 'grid'>('table')
const loading = ref(false)
const submitError = ref<string | null>(null)
const { currentUser } = useAuth()

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
  if (status === 'COMPLETED') return 'Concluída'
  if (status === 'STARTED') return 'Em andamento'
  return 'Programada'
}

function formatDate(dateStr: string) {
  const [y = '', m = '', d = ''] = dateStr.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

async function carregarDados() {
  loading.value = true; submitError.value = null
  try {
    const isTechnician = currentUser.value?.role === 'technician'
    const employeeId = isTechnician ? Number(currentUser.value?.id) : undefined
    const m = await manutencaoService.listar(employeeId)
    manutencoes.value = m
  } catch (error) {
    submitError.value = getApiErrorMessage(error, 'Não foi possível carregar os dados.')
  } finally { loading.value = false }
}

const filters = [
  { key: 'todas', label: 'Todas' },
  { key: 'SCHEDULED', label: 'Programadas' },
  { key: 'STARTED', label: 'Em andamento' },
  { key: 'COMPLETED', label: 'Concluída' },
] as const

const filterOptions = filters.map(f => ({ value: f.key, label: f.label }))
const filterValue = computed({
  get: () => activeFilter.value as string | number,
  set: (v) => { activeFilter.value = (v ?? 'todas') as typeof activeFilter.value },
})

const contratosUnicos = computed(() => {
  const map = new Map<number, { id: number, name: string }>()
  for (const m of manutencoes.value) {
    if (!map.has(m.contract.id)) {
      map.set(m.contract.id, { id: m.contract.id, name: m.contract.client.name })
    }
  }
  return Array.from(map.values())
})

const filterContratoOptions = computed(() => [
  { value: -1, label: 'Todos os contratos' },
  ...contratosUnicos.value.map(c => ({ value: c.id, label: `#${String(c.id).padStart(3, '0')} — ${c.name}` })),
])
const filterContratoValue = computed({
  get: () => filterContrato.value ?? -1,
  set: (v) => { filterContrato.value = v === -1 ? null : (v as number) },
})

onMounted(carregarDados)
</script>

<template>
  <div class="nd-page">
    <nav class="manutencoes-nav">
      <button class="manutencoes-tab" :class="{ 'manutencoes-tab--active': activeTab === 'agenda' }" @click="activeTab = 'agenda'">
        Agenda
      </button>
      <button class="manutencoes-tab" :class="{ 'manutencoes-tab--active': activeTab === 'manutencoes' }" @click="activeTab = 'manutencoes'">
        Manutenções
      </button>
    </nav>

    <template v-if="activeTab === 'manutencoes'">
      <Dialog v-model:open="detailOpen">
        <DialogContent class="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle class="nd-dialog-title">DETALHES DA MANUTENÇÃO</DialogTitle>
            <DialogDescription class="sr-only">Detalhes da manutenção</DialogDescription>
          </DialogHeader>
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
              <span class="nd-field-label">Endereço</span>
              <GeocodedAddress :lat="detailItem.latitude" :lng="detailItem.longitude" />
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
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <button type="button" class="nd-btn-secondary">FECHAR</button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <span class="nd-label">Concluídas</span>
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
          <div class="nd-progress-label-col"><span class="nd-label">Concluídas</span><span class="nd-label nd-label--dim">{{ counts.completed }}</span></div>
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
            <col class="nd-col--data"><col><col class="nd-col--tipo"><col class="nd-col--count"><col class="nd-col--status">
          </colgroup>
          <thead>
            <tr>
              <th class="nd-th">DATA</th>
              <th class="nd-th">CLIENTE</th>
              <th class="nd-th">TIPO</th>
              <th class="nd-th nd-th--center">TÉCNICOS</th>
              <th class="nd-th nd-th--status">STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" class="nd-empty">Carregando...</td></tr>
            <tr v-for="m in filteredManutencoes" :key="m.id" class="nd-tr nd-tr--clickable" @click="openDetail(m)">
              <td class="nd-td nd-td--mono">{{ formatDate(m.date) }}</td>
              <td class="nd-td nd-td--primary">{{ m.contract.client.name }}</td>
              <td class="nd-td nd-td--secondary">{{ m.type }}</td>
              <td class="nd-td nd-td--mono nd-td--center">{{ String(m.employees.length).padStart(2, '0') }}</td>
              <td class="nd-td nd-td--status">
                <span class="nd-tag" :style="{ color: statusColor(m.status), borderColor: statusColor(m.status) }">{{ statusLabel(m.status) }}</span>
              </td>
            </tr>
            <tr v-if="!loading && filteredManutencoes.length === 0"><td colspan="5" class="nd-empty">NENHUMA MANUTENÇÃO ENCONTRADA</td></tr>
          </tbody>
        </table>
      </div>

      <div v-else class="nd-grid">
        <div v-if="loading" class="nd-empty nd-empty--grid">Carregando...</div>
        <div v-for="m in filteredManutencoes" :key="m.id" class="nd-card" @click="openDetail(m)">
          <div class="nd-card-top">
            <span class="nd-card-date">{{ formatDate(m.date) }}</span>
          </div>
          <p class="nd-card-name">{{ m.contract.client.name }}</p>
          <GeocodedAddress :lat="m.latitude" :lng="m.longitude" />
          <span class="nd-card-tipo">{{ m.type }}</span>
          <span class="nd-card-tecnicos">{{ m.employees.length }} TÉCNICO{{ m.employees.length !== 1 ? 's' : '' }}</span>
          <div class="nd-card-footer">
            <span class="nd-tag" :style="{ color: statusColor(m.status), borderColor: statusColor(m.status) }">{{ statusLabel(m.status) }}</span>
          </div>
        </div>
        <div v-if="!loading && filteredManutencoes.length === 0" class="nd-empty nd-empty--grid">NENHUMA MANUTENÇÃO ENCONTRADA</div>
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
.nd-label { font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.01em; font-weight: 500; color: var(--nd-text-secondary); line-height: 1.2; }
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
.nd-col--data { width: 88px; } .nd-col--tipo { width: 110px; } .nd-col--count { width: 72px; } .nd-col--status { width: 160px; }
.nd-table-wrap { overflow-x: auto; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-th { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 700; color: var(--nd-text-secondary); text-align: left; padding: 0 16px 10px 0; border-bottom: 1px solid var(--nd-border-visible); white-space: nowrap; }
.nd-th--center { text-align: center; padding-right: 16px; }
.nd-th--status { padding-left: 20px; padding-right: 0; }
.nd-tr { border-bottom: 1px solid var(--nd-border); transition: background 150ms ease-out; }
.nd-tr:hover { background: var(--nd-surface); }
.nd-tr--clickable { cursor: pointer; }
.nd-td { padding: 13px 16px 13px 0; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-secondary); vertical-align: middle; }
.nd-td--primary { color: var(--nd-text-primary); }
.nd-td--secondary { color: var(--nd-text-secondary); }
.nd-td--mono { font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.02em; }
.nd-td--center { text-align: center; padding-right: 16px; }
.nd-td--status { padding-left: 20px; padding-right: 0; }
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
.nd-detail-tipo { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-secondary); }
.nd-detail-value--mono { font-family: 'Montserrat', sans-serif; font-size: 14px; letter-spacing: 0.04em; }
.nd-detail-value--dim { font-family: 'Montserrat', sans-serif; font-size: 11px; color: var(--nd-text-disabled); }
.nd-detail-list { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
.nd-detail-list-item { display: flex; align-items: center; gap: 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-primary); }
.nd-detail-list-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--nd-action); flex-shrink: 0; }
.nd-field-label { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--nd-text-disabled); margin-bottom: 6px; display: block; }
.nd-detail-section { display: flex; flex-direction: column; gap: 4px; margin-top: 16px; }

@media (max-width: 640px) {
  .nd-controls-row { flex-direction: column; align-items: stretch; gap: 12px; }
  .nd-controls-left { flex-direction: column; align-items: stretch; }
  .nd-controls-right { justify-content: space-between; }
  .nd-filter-select { width: 100%; }
  .nd-search { flex: 1; }
  .nd-search-input { width: 100%; min-width: 0; }
  .nd-grid { grid-template-columns: 1fr; }
  .nd-progress-label-col { min-width: 110px; }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .nd-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
