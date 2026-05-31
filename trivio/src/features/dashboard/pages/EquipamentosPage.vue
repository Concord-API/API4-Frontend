<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Search, Plus, Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { equipamentoService, type EquipamentoAPI } from '@/shared/services/equipamentoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { useEquipamentosStore } from '@/shared/composables/useEquipamentosStore'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import ConfirmActionDialog from '@/shared/components/ui/ConfirmActionDialog.vue'
import ViewToggle from '@/shared/components/ui/ViewToggle.vue'

const searchQuery = ref('')
const activeFilter = ref<'todos' | 'ativo' | 'inativo'>('todos')
const viewMode = ref<'table' | 'grid'>('table')
const sheetOpen = ref(false)
const sheetMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const submitError = ref<string | null>(null)
const confirmInactiveOpen = ref(false)

const {
  items: equipamentos,
  loading,
  error: loadError,
  ensureLoaded: ensureEquipamentosLoaded,
  refresh: refreshEquipamentos,
} = useEquipamentosStore()

const erro = computed(() => submitError.value ?? loadError.value)

const form = ref({ name: '', model: '', manufacturer: '', active: true })

function resetForm() {
  form.value = { name: '', model: '', manufacturer: '', active: true }
}

const detailOpen = ref(false)
const detailItem = ref<EquipamentoAPI | null>(null)

function openDetail(e: EquipamentoAPI) { detailItem.value = e; detailOpen.value = true }
function openEditFromDetail() {
  if (!detailItem.value) return
  const e = detailItem.value; detailOpen.value = false; openEdit(e)
}

function openCreate() {
  resetForm()
  editingId.value = null
  sheetMode.value = 'create'
  sheetOpen.value = true
}

function openEdit(e: EquipamentoAPI) {
  form.value = {
    name: e.name,
    model: e.model ?? '',
    manufacturer: e.manufacturer ?? '',
    active: e.active ?? true,
  }
  editingId.value = e.id_equipment
  sheetMode.value = 'edit'
  sheetOpen.value = true
}

watch(sheetOpen, open => {
  if (!open) { resetForm(); editingId.value = null; submitError.value = null }
})

const counts = computed(() => ({
  ativos: equipamentos.value.filter(e => e.active).length,
  inativos: equipamentos.value.filter(e => !e.active).length,
  total: equipamentos.value.length,
}))

const filtered = computed(() => {
  let result = equipamentos.value
  if (activeFilter.value === 'ativo') result = result.filter(e => e.active)
  else if (activeFilter.value === 'inativo') result = result.filter(e => !e.active)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.model ?? '').toLowerCase().includes(q) ||
      (e.manufacturer ?? '').toLowerCase().includes(q),
    )
  }
  return result
})

function isInactivatingEquipamento() {
  const original = equipamentos.value.find(e => e.id_equipment === editingId.value)
  return sheetMode.value === 'edit' && original?.active !== false && !form.value.active
}

async function submitForm(confirmedInactive = false) {
  submitError.value = null
  if (isInactivatingEquipamento() && !confirmedInactive) {
    confirmInactiveOpen.value = true
    return
  }
  confirmInactiveOpen.value = false
  try {
    if (sheetMode.value === 'edit' && editingId.value) {
      await equipamentoService.atualizar(editingId.value, {
        name: form.value.name,
        model: form.value.model || null,
        manufacturer: form.value.manufacturer || null,
        active: form.value.active,
      })
      toast.success('Equipamento atualizado.')
    } else {
      const res = await equipamentoService.criar({
        name: form.value.name,
        model: form.value.model || null,
        manufacturer: form.value.manufacturer || null,
        active: form.value.active,
      })
      if (res.status === 201) toast.success('Equipamento criado com sucesso.')
    }
    sheetOpen.value = false
  } catch (error) {
    const msg = getApiErrorMessage(error, 'Nao foi possivel salvar o equipamento.')
    submitError.value = msg; toast.error(msg); return
  }
  try { await refreshEquipamentos() } catch (error) {
    const msg = getApiErrorMessage(error, 'Salvo, mas nao foi possivel atualizar a lista.')
    submitError.value = msg; toast.error(msg)
  }
}

const filters = [
  { key: 'todos', label: 'Todos' },
  { key: 'ativo', label: 'Ativos' },
  { key: 'inativo', label: 'Inativos' },
] as const

onMounted(() => { void ensureEquipamentosLoaded() })
</script>

<template>
  <div class="nd-page">



    <button class="nd-fab" @click="openCreate" aria-label="Novo equipamento">
      <Plus :size="20" />
    </button>

    <Dialog v-model:open="sheetOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="nd-dialog-title">{{ sheetMode === 'edit' ? 'Editar equipamento' : 'Novo equipamento' }}</DialogTitle>
          <DialogDescription class="sr-only">{{ sheetMode === 'edit' ? 'Editar equipamento' : 'Novo equipamento' }}</DialogDescription>
        </DialogHeader>
        <form class="nd-form grid grid-cols-1 sm:grid-cols-2 gap-x-4" @submit.prevent="submitForm()">
          <div class="nd-field col-span-full">
            <label class="nd-field-label">Nome *</label>
            <input v-model="form.name" class="nd-field-input" placeholder="Nome do equipamento" required />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">Modelo</label>
            <input v-model="form.model" class="nd-field-input" placeholder="Ex: XC-200" />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">Fabricante</label>
            <input v-model="form.manufacturer" class="nd-field-input" placeholder="Ex: Atlas Copco" />
          </div>
          <div class="nd-field col-span-full">
            <label class="nd-field-label">Status</label>
            <div class="nd-toggle-row">
              <button type="button" class="nd-toggle" :class="{ 'nd-toggle--on': form.active }" @click="form.active = !form.active">
                <span class="nd-toggle-thumb" />
              </button>
              <span class="nd-toggle-label">{{ form.active ? 'Ativo' : 'Inativo' }}</span>
            </div>
          </div>
          <div v-if="submitError" class="nd-field-error col-span-full">{{ submitError }}</div>
          <DialogFooter class="col-span-full">
            <DialogClose as-child>
              <button type="button" class="nd-btn-secondary">CANCELAR</button>
            </DialogClose>
            <button type="submit" class="nd-btn-primary">
              {{ sheetMode === 'edit' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR EQUIPAMENTO' }}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <ConfirmActionDialog
      v-model:open="confirmInactiveOpen"
      title="Inativar equipamento?"
      description="Este equipamento ficara inativo e deixara de aparecer como opcao ativa em novos contratos."
      confirm-label="Inativar"
      destructive
      @confirm="submitForm(true)"
    />

    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="nd-dialog-title">Detalhes do equipamento</DialogTitle>
          <DialogDescription class="sr-only">Detalhes do equipamento</DialogDescription>
        </DialogHeader>
        <div v-if="detailItem" class="nd-detail">
          <div class="nd-detail-status-row">
            <span class="nd-tag nd-tag--lg" :style="detailItem.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ detailItem.active ? 'Ativo' : 'Inativo' }}</span>
          </div>
          <div class="nd-detail-section">
            <span class="nd-field-label">Nome</span>
            <span class="nd-detail-value">{{ detailItem.name }}</span>
          </div>
          <div v-if="detailItem.model" class="nd-detail-section">
            <span class="nd-field-label">Modelo</span>
            <span class="nd-detail-value nd-detail-value--secondary">{{ detailItem.model }}</span>
          </div>
          <div v-if="detailItem.manufacturer" class="nd-detail-section">
            <span class="nd-field-label">Fabricante</span>
            <span class="nd-detail-value nd-detail-value--secondary">{{ detailItem.manufacturer }}</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <button type="button" class="nd-btn-secondary">FECHAR</button>
          </DialogClose>
          <button class="nd-btn-primary" type="button" @click="openEditFromDetail">
            <Pencil :size="12" /> Editar equipamento
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <div v-if="erro" class="nd-error">{{ erro }}</div>

    <div class="nd-stats-row">
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-success)">{{ String(counts.ativos).padStart(2, '0') }}</span>
        <span class="nd-label">Ativos</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-accent)">{{ String(counts.inativos).padStart(2, '0') }}</span>
        <span class="nd-label">Inativos</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val">{{ String(counts.total).padStart(2, '0') }}</span>
        <span class="nd-label">Total</span>
      </div>
      <button class="nd-btn-primary nd-btn-desktop" style="margin-left: auto" @click="openCreate">
        <Plus :size="12" /> CADASTRAR EQUIPAMENTO
      </button>
    </div>

    <div class="nd-controls-row">
      <div class="nd-segmented">
        <button v-for="f in filters" :key="f.key" class="nd-seg-btn" :class="{ 'nd-seg-btn--active': activeFilter === f.key }" @click="activeFilter = f.key">{{ f.label }}</button>
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
          <col><col style="width:120px"><col style="width:160px"><col style="width:90px"><col style="width:44px">
        </colgroup>
        <thead>
          <tr>
            <th class="nd-th">EQUIPAMENTO</th>
            <th class="nd-th">MODELO</th>
            <th class="nd-th">FABRICANTE</th>
            <th class="nd-th">STATUS</th>
            <th class="nd-th" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="5" class="nd-empty">Carregando...</td></tr>
          <tr v-for="e in filtered" :key="e.id_equipment" class="nd-tr nd-tr--clickable" @click="openDetail(e)">
            <td class="nd-td nd-td--primary">{{ e.name }}</td>
            <td class="nd-td nd-td--secondary">{{ e.model ?? '—' }}</td>
            <td class="nd-td nd-td--secondary">{{ e.manufacturer ?? '—' }}</td>
            <td class="nd-td">
              <span class="nd-tag" :style="e.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ e.active ? 'Ativo' : 'Inativo' }}</span>
            </td>
            <td class="nd-td nd-td--action">
              <button class="nd-edit-btn" type="button" @click.stop="openEdit(e)"><Pencil :size="12" /></button>
            </td>
          </tr>
          <tr v-if="!loading && filtered.length === 0"><td colspan="5" class="nd-empty">Nenhum equipamento cadastrado</td></tr>
        </tbody>
      </table>
    </div>

    <div v-else class="nd-grid">
      <div v-if="loading" class="nd-empty nd-empty--grid">Carregando...</div>
      <div v-for="e in filtered" :key="e.id_equipment" class="nd-card" @click="openDetail(e)">
        <div class="nd-card-top-row">
          <span class="nd-card-cat">Equipamento</span>
          <button class="nd-card-edit-btn" type="button" @click.stop="openEdit(e)"><Pencil :size="11" /></button>
        </div>
        <p class="nd-card-name">{{ e.name }}</p>
        <div class="nd-card-meta">
          <span v-if="e.model" class="nd-card-detail">{{ e.model }}</span>
          <span v-if="e.manufacturer" class="nd-card-detail">{{ e.manufacturer }}</span>
          <span v-if="!e.model && !e.manufacturer" class="nd-card-detail">—</span>
        </div>
        <div class="nd-card-footer">
          <span class="nd-tag" :style="e.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ e.active ? 'Ativo' : 'Inativo' }}</span>
        </div>
      </div>
      <div v-if="!loading && filtered.length === 0" class="nd-empty nd-empty--grid">Nenhum equipamento cadastrado</div>
    </div>

  </div>
</template>

<style scoped>
.nd-page { display: flex; flex-direction: column; gap: 0; min-height: 100%; }
.nd-error { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-accent); margin-bottom: 16px; }
.nd-label { font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.01em; font-weight: 500; color: var(--nd-text-secondary); line-height: 1.2; }
.nd-stats-row { display: flex; align-items: center; gap: 24px; padding: 20px 0; border-top: 1px solid var(--nd-border); border-bottom: 1px solid var(--nd-border); margin-bottom: 28px; }

.nd-btn-primary { display: flex; align-items: center; gap: 6px; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; background: var(--nd-action); color: var(--nd-action-foreground); border: none; border-radius: 999px; padding: 8px 16px; cursor: pointer; transition: background-color 150ms ease-out; }
.nd-btn-primary:hover { background: var(--nd-action-hover); }
.nd-btn-desktop { display: flex; }
.nd-stat { display: flex; flex-direction: column; gap: 4px; }
.nd-stat-val { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; color: var(--nd-text-display); line-height: 1.1; }
.nd-stat-sep { width: 1px; height: 28px; background: var(--nd-border-visible); }
.nd-controls-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.nd-controls-right { display: flex; align-items: center; gap: 16px; }
.nd-segmented { display: flex; border: 1px solid var(--nd-border-visible); border-radius: 999px; overflow: hidden; }
.nd-seg-btn { font-family: 'Montserrat', sans-serif; font-size: 10px; letter-spacing: 0.02em; font-weight: 500; background: transparent; color: var(--nd-text-disabled); border: none; padding: 7px 14px; cursor: pointer; transition: color 150ms ease-out, background 150ms ease-out; }
.nd-seg-btn:hover { color: var(--nd-text-secondary); }
.nd-seg-btn--active { background: var(--nd-text-display); color: var(--nd-bg); }
.nd-search { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--nd-border-visible); padding-bottom: 6px; }
.nd-search-icon { color: var(--nd-text-disabled); }
.nd-search-input { background: transparent; border: none; outline: none; font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.01em; color: var(--nd-text-primary); width: 180px; }
.nd-search-input::placeholder { color: var(--nd-text-disabled); }

.nd-table-wrap { overflow-x: auto; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-th { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 700; color: var(--nd-text-secondary); text-align: left; padding: 0 16px 10px 0; border-bottom: 1px solid var(--nd-border-visible); white-space: nowrap; }
.nd-tr { border-bottom: 1px solid var(--nd-border); transition: background 150ms ease-out; }
.nd-tr:hover { background: var(--nd-surface); }
.nd-tr:hover .nd-edit-btn { opacity: 1; }
.nd-tr--clickable { cursor: pointer; }
.nd-td { padding: 13px 16px 13px 0; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-secondary); vertical-align: middle; }
.nd-td--primary { color: var(--nd-text-primary); }
.nd-td--secondary { color: var(--nd-text-secondary); }
.nd-td--action { padding-right: 0; width: 44px; }
.nd-edit-btn { opacity: 0; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 6px; cursor: pointer; color: var(--nd-text-secondary); transition: opacity 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out; }
.nd-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-empty { padding: 48px 0; font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-text-disabled); text-align: center; }

.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.nd-empty--grid { grid-column: 1 / -1; }
.nd-card { background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color 150ms ease-out; display: flex; flex-direction: column; gap: 6px; }
.nd-card:hover { border-color: var(--nd-border-visible); }
.nd-card-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: -2px; }
.nd-card-cat { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.03em; color: var(--nd-text-disabled); }
.nd-card-edit-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 6px; cursor: pointer; color: var(--nd-text-secondary); transition: color 150ms ease-out, border-color 150ms ease-out; }
.nd-card-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-card-name { font-family: 'Montserrat', sans-serif; font-size: 15px; color: var(--nd-text-primary); margin: 4px 0 0; line-height: 1.3; }
.nd-card-meta { display: flex; flex-direction: column; gap: 2px; }
.nd-card-detail { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.03em; color: var(--nd-text-secondary); }
.nd-card-footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--nd-border); display: flex; align-items: center; justify-content: space-between; }



.nd-fab { display: none; }

@media (max-width: 640px) {
  .nd-controls-row { flex-direction: column; align-items: stretch; gap: 12px; }
  .nd-controls-right { justify-content: space-between; }
  .nd-search { flex: 1; }
  .nd-search-input { width: 100%; min-width: 0; }
  .nd-grid { grid-template-columns: 1fr; }
  .nd-hero-number { font-size: 56px; }
  .nd-btn-desktop { display: none; }
  .nd-fab { display: flex; align-items: center; justify-content: center; position: fixed; bottom: 24px; right: 24px; width: 52px; height: 52px; border-radius: 50%; background: var(--nd-action); color: var(--nd-action-foreground); border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.4); transition: background-color 150ms ease-out; z-index: 50; }
  .nd-fab:hover { background: var(--nd-action-hover); }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .nd-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
