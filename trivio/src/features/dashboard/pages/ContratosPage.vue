<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Search, Plus, Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { contratoService, type ContratoAPI } from '@/shared/services/contratoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { useClientesStore } from '@/shared/composables/useClientesStore'
import { useContratosStore } from '@/shared/composables/useContratosStore'
import { useEquipamentosStore } from '@/shared/composables/useEquipamentosStore'
import { useRequisitosStore } from '@/shared/composables/useRequisitosStore'
import ViewToggle from '@/shared/components/ui/ViewToggle.vue'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'
import NdMultiCombobox from '@/shared/components/ui/NdMultiCombobox.vue'

const searchQuery = ref('')
const activeFilter = ref<'todos' | 'ativo' | 'inativo' | 'vencido'>('todos')
const viewMode = ref<'table' | 'grid'>('table')
const sheetOpen = ref(false)
const sheetMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const submitError = ref<string | null>(null)

const { items: contratos, loading: loadingContratos, error: contratosError, ensureLoaded: ensureContratosLoaded, refresh: refreshContratos } = useContratosStore()
const { items: clientes, loading: loadingClientes, error: clientesError, ensureLoaded: ensureClientesLoaded } = useClientesStore()
const { items: equipamentos, loading: loadingEquipamentos, error: equipamentosError, ensureLoaded: ensureEquipamentosLoaded } = useEquipamentosStore()
const { items: requisitos, loading: loadingRequisitos, error: requisitosError, ensureLoaded: ensureRequisitosLoaded } = useRequisitosStore()

const loading = computed(() => loadingContratos.value || loadingClientes.value || loadingEquipamentos.value || loadingRequisitos.value)
const erro = computed(() => submitError.value ?? contratosError.value ?? clientesError.value ?? equipamentosError.value ?? requisitosError.value)

const clienteOptions = computed(() => clientes.value.map(c => ({ value: c.id_client, label: c.name })))
const equipamentoOptions = computed(() => equipamentos.value.map(e => ({ value: e.id_equipment, label: e.model ? `${e.name} — ${e.model}` : e.name })))
const requisitoOptions = computed(() => requisitos.value.filter(r => r.active).map(r => ({ value: r.id, label: r.name })))

const defaultForm = () => ({
  clientId: null as number | null,
  initialDate: '',
  finalDate: '',
  recurrenceMaintenance: 30,
  active: true,
  equipmentIds: [] as number[],
  requirementIds: [] as number[],
})

const form = ref(defaultForm())

const hoje = new Date().toISOString().split('T')[0] ?? ''
function isVencido(finalDate: string) { return finalDate < hoje }

const detailOpen = ref(false)
const detailItem = ref<ContratoAPI | null>(null)

function openDetail(c: ContratoAPI) { detailItem.value = c; detailOpen.value = true }
function openEditFromDetail() {
  if (!detailItem.value) return
  const c = detailItem.value; detailOpen.value = false; openEdit(c)
}

function openCreate() {
  form.value = defaultForm(); editingId.value = null; sheetMode.value = 'create'; sheetOpen.value = true
}

function openEdit(c: ContratoAPI) {
  form.value = {
    clientId: c.client.id_client,
    initialDate: c.initialDate,
    finalDate: c.finalDate,
    recurrenceMaintenance: c.recurrenceMaintenance,
    active: c.active,
    equipmentIds: c.equipments.map(e => e.id_equipment),
    requirementIds: (c.requirements ?? []).map(r => r.id),
  }
  editingId.value = c.id; sheetMode.value = 'edit'; sheetOpen.value = true
}

watch(sheetOpen, open => {
  if (!open) { form.value = defaultForm(); editingId.value = null; submitError.value = null }
})

const counts = computed(() => ({
  total: contratos.value.length,
  ativos: contratos.value.filter(c => c.active && !isVencido(c.finalDate)).length,
  vencidos: contratos.value.filter(c => isVencido(c.finalDate)).length,
  inativos: contratos.value.filter(c => !c.active).length,
}))

const filteredContratos = computed(() => {
  let result = contratos.value
  if (activeFilter.value === 'ativo') result = result.filter(c => c.active && !isVencido(c.finalDate))
  else if (activeFilter.value === 'vencido') result = result.filter(c => isVencido(c.finalDate))
  else if (activeFilter.value === 'inativo') result = result.filter(c => !c.active)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(c => c.client.name.toLowerCase().includes(q) || String(c.id).includes(q))
  }
  return result
})


function formatDate(dateStr: string) {
  const [y = '', m = '', d = ''] = dateStr.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

function contratoStatus(c: ContratoAPI): { label: string; color: string } {
  if (isVencido(c.finalDate)) return { label: 'Vencido', color: 'var(--nd-accent)' }
  if (!c.active) return { label: 'Inativo', color: 'var(--nd-text-disabled)' }
  return { label: 'Ativo', color: 'var(--nd-success)' }
}

async function submitForm() {
  if (!form.value.clientId) { submitError.value = 'Selecione um cliente.'; toast.error(submitError.value); return }
  submitError.value = null
  const payload = {
    clientId: form.value.clientId,
    initialDate: form.value.initialDate,
    finalDate: form.value.finalDate,
    recurrenceMaintenance: form.value.recurrenceMaintenance,
    active: form.value.active,
    equipmentIds: form.value.equipmentIds,
    requirementIds: form.value.requirementIds,
  }
  try {
    if (sheetMode.value === 'edit' && editingId.value) {
      await contratoService.atualizar(editingId.value, payload)
      toast.success('Contrato atualizado.')
    } else {
      const res = await contratoService.criar(payload)
      if (res.status === 201) toast.success('Contrato criado com sucesso.')
    }
    sheetOpen.value = false
  } catch (error) {
    const msg = getApiErrorMessage(error, 'Nao foi possivel salvar o contrato.')
    submitError.value = msg; toast.error(msg); return
  }
  try { await refreshContratos() } catch (error) {
    const msg = getApiErrorMessage(error, 'Salvo, mas nao foi possivel atualizar a lista.')
    submitError.value = msg; toast.error(msg)
  }
}

const filters = [
  { key: 'todos', label: 'Todos' },
  { key: 'ativo', label: 'Ativos' },
  { key: 'vencido', label: 'Vencidos' },
  { key: 'inativo', label: 'Inativos' },
] as const

const filterOptions = filters.map(f => ({ value: f.key, label: f.label }))
const filterValue = computed({
  get: () => activeFilter.value as string | number,
  set: (v) => { activeFilter.value = (v ?? 'todos') as typeof activeFilter.value },
})

onMounted(() => {
  void Promise.all([ensureContratosLoaded(), ensureClientesLoaded(), ensureEquipamentosLoaded(), ensureRequisitosLoaded()])
})
</script>

<template>
  <div class="nd-page">

    <div class="nd-action-row">
      <button class="nd-btn-primary" @click="openCreate">
        <Plus :size="12" /> Novo contrato
      </button>
    </div>

    <Sheet v-model:open="sheetOpen">
      <SheetContent class="nd-sheet">
        <SheetHeader class="nd-sheet-header">
          <SheetTitle class="nd-sheet-title">{{ sheetMode === 'edit' ? 'Editar contrato' : 'Novo contrato' }}</SheetTitle>
          <SheetDescription class="sr-only">{{ sheetMode === 'edit' ? 'Editar contrato' : 'Novo contrato' }}</SheetDescription>
        </SheetHeader>
        <form class="nd-form" @submit.prevent="submitForm">
          <div class="nd-field">
            <label class="nd-field-label">Cliente *</label>
            <NdCombobox v-model="form.clientId" :options="clienteOptions" placeholder="Selecione o cliente" search-placeholder="Buscar cliente..." />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">DATA DE INÍCIO *</label>
            <input v-model="form.initialDate" type="date" class="nd-field-input" required />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">Data de fim *</label>
            <input v-model="form.finalDate" type="date" class="nd-field-input" required />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">RECORRÊNCIA DE MANUTENÇÃO (DIAS) *</label>
            <input v-model.number="form.recurrenceMaintenance" type="number" min="1" class="nd-field-input" placeholder="Ex: 30" required />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">Equipamentos</label>
            <NdMultiCombobox
              v-model="form.equipmentIds"
              :options="equipamentoOptions"
              placeholder="Selecione os equipamentos"
              search-placeholder="Buscar equipamento..."
              singular-label="equipamento"
              plural-label="equipamentos"
            />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">Requisitos</label>
            <NdMultiCombobox
              v-model="form.requirementIds"
              :options="requisitoOptions"
              placeholder="Selecione os requisitos"
              search-placeholder="Buscar requisito..."
              singular-label="requisito"
              plural-label="requisitos"
            />
          </div>
          <div v-if="submitError" class="nd-field-error">{{ submitError }}</div>
          <div class="nd-form-footer">
            <button type="submit" class="nd-btn-primary nd-btn-full">
              {{ sheetMode === 'edit' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR CONTRATO' }}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <!-- DETAIL SHEET -->
    <Sheet v-model:open="detailOpen">
      <SheetContent class="nd-sheet nd-sheet--detail">
        <SheetHeader class="nd-sheet-header">
          <SheetTitle class="nd-sheet-title">Detalhes do contrato</SheetTitle>
          <SheetDescription class="sr-only">Detalhes do contrato</SheetDescription>
        </SheetHeader>
        <div v-if="detailItem" class="nd-detail">
          <div class="nd-detail-status-row">
            <span class="nd-tag nd-tag--lg" :style="{ color: contratoStatus(detailItem).color, borderColor: contratoStatus(detailItem).color }">{{ contratoStatus(detailItem).label }}</span>
            <span class="nd-detail-id">#{{ String(detailItem.id).padStart(3, '0') }}</span>
          </div>
          <div class="nd-detail-section">
            <span class="nd-field-label">Cliente</span>
            <span class="nd-detail-value">{{ detailItem.client.name }}</span>
          </div>
          <div class="nd-detail-section">
            <span class="nd-field-label">VIGÊNCIA</span>
            <span class="nd-detail-value nd-detail-value--mono">{{ formatDate(detailItem.initialDate) }} → {{ formatDate(detailItem.finalDate) }}</span>
          </div>
          <div class="nd-detail-section">
            <span class="nd-field-label">RECORRÊNCIA</span>
            <span class="nd-detail-value nd-detail-value--mono">{{ detailItem.recurrenceMaintenance }} dias</span>
          </div>
          <div class="nd-detail-section">
            <span class="nd-field-label">EQUIPAMENTOS ({{ detailItem.equipments.length }})</span>
            <div v-if="detailItem.equipments.length" class="nd-detail-list">
              <div v-for="eq in detailItem.equipments" :key="eq.id_equipment" class="nd-detail-list-item">
                <span class="nd-detail-list-dot" />{{ eq.name }}<span v-if="eq.model" class="nd-detail-list-sub">{{ eq.model }}</span>
              </div>
            </div>
            <span v-else class="nd-detail-value--dim">Nenhum equipamento</span>
          </div>
          <div v-if="detailItem.requirements?.length" class="nd-detail-section">
            <span class="nd-field-label">REQUISITOS ({{ detailItem.requirements.length }})</span>
            <div class="nd-detail-list">
              <div v-for="req in detailItem.requirements" :key="req.id" class="nd-detail-list-item">
                <span class="nd-detail-list-dot" />{{ req.name }}
              </div>
            </div>
          </div>
          <div class="nd-detail-footer">
            <button class="nd-btn-primary nd-btn-full" type="button" @click="openEditFromDetail">
              <Pencil :size="12" /> Editar contrato
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <div v-if="erro" class="nd-error">{{ erro }}</div>

    <div class="nd-hero">
      <div class="nd-hero-number">
        <span v-if="loading">—</span>
        <span v-else>{{ String(contratos.length).padStart(2, '0') }}</span>
      </div>
      <div class="nd-hero-context">
        <span class="nd-label">Contratos registrados</span>
      </div>
    </div>

    <div class="nd-stats-row">
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-success)">{{ String(counts.ativos).padStart(2, '0') }}</span>
        <span class="nd-label">Ativos</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-accent)">{{ String(counts.vencidos).padStart(2, '0') }}</span>
        <span class="nd-label">Vencidos</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-text-disabled)">{{ String(counts.inativos).padStart(2, '0') }}</span>
        <span class="nd-label">Inativos</span>
      </div>
    </div>

    <div class="nd-controls-row">
      <div class="nd-filter-select">
        <NdCombobox v-model="filterValue" :options="filterOptions" placeholder="Filtrar" :search-placeholder="''" />
      </div>
      <div class="nd-controls-right">
        <div class="nd-search">
          <Search :size="13" class="nd-search-icon" />
          <input v-model="searchQuery" type="text" placeholder="Buscar contrato..." class="nd-search-input" />
        </div>
        <ViewToggle v-model="viewMode" />
      </div>
    </div>

    <!-- TABLE VIEW -->
    <div v-if="viewMode === 'table'" class="nd-table-wrap">
      <table class="nd-table">
        <colgroup>
          <col class="nd-col--id"><col><col class="nd-col--date"><col class="nd-col--date"><col class="nd-col--recorrencia"><col class="nd-col--equip"><col class="nd-col--status"><col style="width:44px">
        </colgroup>
        <thead>
          <tr>
            <th class="nd-th nd-th--id">ID</th>
            <th class="nd-th">CLIENTE</th>
            <th class="nd-th">INÍCIO</th>
            <th class="nd-th">FIM</th>
            <th class="nd-th nd-th--center">RECORRÊNCIA</th>
            <th class="nd-th nd-th--center">EQUIPAMENTOS</th>
            <th class="nd-th nd-th--status">STATUS</th>
            <th class="nd-th" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="nd-empty">Carregando...</td></tr>
          <tr v-for="c in filteredContratos" :key="c.id" class="nd-tr nd-tr--clickable" :class="{ 'nd-tr--alert': isVencido(c.finalDate) }" @click="openDetail(c)">
            <td class="nd-td nd-td--mono nd-td--id">#{{ String(c.id).padStart(3, '0') }}</td>
            <td class="nd-td nd-td--primary">{{ c.client.name }}</td>
            <td class="nd-td nd-td--mono">{{ formatDate(c.initialDate) }}</td>
            <td class="nd-td nd-td--mono">{{ formatDate(c.finalDate) }}</td>
            <td class="nd-td nd-td--mono nd-td--center">{{ c.recurrenceMaintenance }}d</td>
            <td class="nd-td nd-td--mono nd-td--center">{{ String(c.equipments.length).padStart(2, '0') }}</td>
            <td class="nd-td nd-td--status">
              <span class="nd-tag" :style="{ color: contratoStatus(c).color, borderColor: contratoStatus(c).color }">{{ contratoStatus(c).label }}</span>
            </td>
            <td class="nd-td nd-td--action">
              <button class="nd-edit-btn" type="button" @click.stop="openEdit(c)"><Pencil :size="12" /></button>
            </td>
          </tr>
          <tr v-if="!loading && filteredContratos.length === 0"><td colspan="8" class="nd-empty">Nenhum contrato cadastrado</td></tr>
        </tbody>
      </table>
    </div>

    <!-- GRID VIEW -->
    <div v-else class="nd-grid">
      <div v-if="loading" class="nd-empty nd-empty--grid">Carregando...</div>
      <div
        v-for="c in filteredContratos"
        :key="c.id"
        class="nd-card"
        :class="{ 'nd-card--vencido': isVencido(c.finalDate) }"
        @click="openDetail(c)"
      >
        <div class="nd-card-top">
          <span class="nd-card-id">#{{ String(c.id).padStart(3, '0') }}</span>
          <div class="nd-card-top-actions">
            <span class="nd-tag" :style="{ color: contratoStatus(c).color, borderColor: contratoStatus(c).color }">{{ contratoStatus(c).label }}</span>
            <button class="nd-card-edit-btn" type="button" @click.stop="openEdit(c)"><Pencil :size="11" /></button>
          </div>
        </div>
        <p class="nd-card-name">{{ c.client.name }}</p>
        <div class="nd-card-dates">
          <div class="nd-card-date-item">
            <span class="nd-card-date-label">INÍCIO</span>
            <span class="nd-card-date-val">{{ formatDate(c.initialDate) }}</span>
          </div>
          <div class="nd-card-date-item">
            <span class="nd-card-date-label">Fim</span>
            <span class="nd-card-date-val">{{ formatDate(c.finalDate) }}</span>
          </div>
        </div>
        <div class="nd-card-footer">
          <span class="nd-card-meta-item">{{ c.recurrenceMaintenance }}d RECORRÊNCIA</span>
          <span class="nd-card-meta-item">{{ c.equipments.length }} equip.</span>
        </div>
      </div>
      <div v-if="!loading && filteredContratos.length === 0" class="nd-empty nd-empty--grid">Nenhum contrato cadastrado</div>
    </div>

  </div>
</template>

<style scoped>
.nd-page { display: flex; flex-direction: column; gap: 0; min-height: 100%; }
.nd-action-row { display: flex; justify-content: flex-end; margin-bottom: 40px; }
.nd-error { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-accent); margin-bottom: 16px; }
.nd-label { font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.01em; font-weight: 500; color: var(--nd-text-secondary); line-height: 1.2; }
.nd-hero { margin-bottom: 32px; }
.nd-hero-number { font-family: 'Montserrat', sans-serif; font-size: 80px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.0; color: var(--nd-text-display); margin-bottom: 6px; }
.nd-hero-context { display: flex; align-items: center; gap: 12px; }
.nd-stats-row { display: flex; align-items: center; gap: 24px; padding: 20px 0; border-top: 1px solid var(--nd-border); border-bottom: 1px solid var(--nd-border); margin-bottom: 32px; }
.nd-stat { display: flex; flex-direction: column; gap: 4px; }
.nd-stat-val { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; color: var(--nd-text-display); line-height: 1.1; }
.nd-stat-sep { width: 1px; height: 28px; background: var(--nd-border-visible); }
.nd-controls-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; }
.nd-controls-right { display: flex; align-items: center; gap: 16px; }
.nd-filter-select { width: 140px; flex-shrink: 0; }
.nd-search { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--nd-border-visible); padding-bottom: 6px; }
.nd-search-icon { color: var(--nd-text-disabled); }
.nd-search-input { background: transparent; border: none; outline: none; font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.01em; color: var(--nd-text-primary); width: 200px; }
.nd-search-input::placeholder { color: var(--nd-text-disabled); }
.nd-col--id { width: 60px; } .nd-col--date { width: 86px; } .nd-col--recorrencia { width: 100px; } .nd-col--equip { width: 110px; } .nd-col--status { width: 96px; }
.nd-table-wrap { overflow-x: auto; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-th { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 700; color: var(--nd-text-secondary); text-align: left; padding: 0 16px 10px 0; border-bottom: 1px solid var(--nd-border-visible); white-space: nowrap; }
.nd-th--center { text-align: center; padding-right: 16px; }
.nd-th--status { padding-left: 20px; padding-right: 0; }
.nd-tr { border-bottom: 1px solid var(--nd-border); transition: background 150ms ease-out; }
.nd-tr:hover { background: var(--nd-surface); }
.nd-tr--alert { border-left: 2px solid var(--nd-accent); }
.nd-tr:hover .nd-edit-btn { opacity: 1; }
.nd-tr--clickable { cursor: pointer; }
.nd-td { padding: 13px 16px 13px 0; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-secondary); vertical-align: middle; }
.nd-td--primary { color: var(--nd-text-primary); }
.nd-td--mono { font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.02em; }
.nd-td--center { text-align: center; padding-right: 16px; }
.nd-td--status { padding-left: 20px; padding-right: 0; }
.nd-td--id { color: var(--nd-text-disabled); }
.nd-td--action { padding-right: 0; width: 44px; }
.nd-edit-btn { opacity: 0; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 6px; cursor: pointer; color: var(--nd-text-secondary); transition: opacity 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out; }
.nd-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-tag { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 8px; border: 1px solid; border-radius: 999px; white-space: nowrap; }
.nd-empty { padding: 48px 0; font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-text-disabled); text-align: center; }
.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.nd-empty--grid { grid-column: 1 / -1; }
.nd-card { background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color 150ms ease-out; display: flex; flex-direction: column; gap: 6px; }
.nd-card:hover { border-color: var(--nd-border-visible); }
.nd-card--vencido { border-left: 2px solid var(--nd-accent); }
.nd-card-top { display: flex; align-items: center; justify-content: space-between; }
.nd-card-top-actions { display: flex; align-items: center; gap: 8px; }
.nd-card-edit-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 6px; cursor: pointer; color: var(--nd-text-secondary); transition: color 150ms ease-out, border-color 150ms ease-out; }
.nd-card-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-card-id { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.04em; color: var(--nd-text-disabled); }
:deep(.nd-sheet--detail) { background: var(--nd-surface) !important; border-left: 1px solid var(--nd-border-visible) !important; padding: 32px 28px; }
.nd-detail { display: flex; flex-direction: column; gap: 28px; }
.nd-detail-status-row { display: flex; align-items: center; gap: 12px; padding-bottom: 20px; border-bottom: 1px solid var(--nd-border); }
.nd-detail-id { font-family: 'Montserrat', sans-serif; font-size: 13px; letter-spacing: 0.06em; color: var(--nd-text-disabled); }
.nd-tag--lg { font-size: 11px; padding: 4px 12px; }
.nd-detail-section { display: flex; flex-direction: column; gap: 8px; }
.nd-detail-value { font-family: 'Montserrat', sans-serif; font-size: 16px; color: var(--nd-text-primary); }
.nd-detail-value--mono { font-family: 'Montserrat', sans-serif; font-size: 13px; letter-spacing: 0.04em; color: var(--nd-text-primary); }
.nd-detail-value--dim { font-family: 'Montserrat', sans-serif; font-size: 11px; color: var(--nd-text-disabled); }
.nd-detail-list { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
.nd-detail-list-item { display: flex; align-items: center; gap: 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-primary); }
.nd-detail-list-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--nd-action); flex-shrink: 0; }
.nd-detail-list-sub { font-family: 'Montserrat', sans-serif; font-size: 10px; letter-spacing: 0.06em; color: var(--nd-text-disabled); margin-left: 4px; }
.nd-detail-footer { margin-top: auto; padding-top: 20px; border-top: 1px solid var(--nd-border); }
.nd-card-name { font-family: 'Montserrat', sans-serif; font-size: 15px; color: var(--nd-text-primary); line-height: 1.3; margin: 0; }
.nd-card-dates { display: flex; gap: 16px; }
.nd-card-date-item { display: flex; flex-direction: column; gap: 1px; }
.nd-card-date-label { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-disabled); }
.nd-card-date-val { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.03em; color: var(--nd-text-secondary); }
.nd-card-footer { margin-top: 4px; padding-top: 10px; border-top: 1px solid var(--nd-border); display: flex; align-items: center; gap: 16px; }
.nd-card-meta-item { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-disabled); }
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
.nd-check-model { font-family: 'Montserrat', sans-serif; font-size: 10px; letter-spacing: 0.06em; color: var(--nd-text-disabled); }
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
  /* tabela densa: força scroll horizontal para não partir layout */
  .nd-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .nd-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
