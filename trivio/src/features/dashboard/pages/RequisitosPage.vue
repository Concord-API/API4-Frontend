<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Search, Plus, Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { requisitoService, type RequisitoAPI } from '@/shared/services/requisitoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { useRequisitosStore } from '@/shared/composables/useRequisitosStore'
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
  items: requisitos,
  loading,
  error: loadError,
  ensureLoaded: ensureRequisitosLoaded,
  refresh: refreshRequisitos,
} = useRequisitosStore()

const erro = computed(() => submitError.value ?? loadError.value)

const form = ref({ name: '', description: '', active: true })

function resetForm() {
  form.value = { name: '', description: '', active: true }
}

const detailOpen = ref(false)
const detailItem = ref<RequisitoAPI | null>(null)

function openDetail(r: RequisitoAPI) { detailItem.value = r; detailOpen.value = true }
function openEditFromDetail() {
  if (!detailItem.value) return
  const r = detailItem.value; detailOpen.value = false; openEdit(r)
}

function openCreate() {
  resetForm(); editingId.value = null; sheetMode.value = 'create'; sheetOpen.value = true
}

function openEdit(r: RequisitoAPI) {
  form.value = { name: r.name, description: r.description ?? '', active: r.active }
  editingId.value = r.id; sheetMode.value = 'edit'; sheetOpen.value = true
}

watch(sheetOpen, open => {
  if (!open) { resetForm(); editingId.value = null; submitError.value = null }
})

const counts = computed(() => ({
  ativos: requisitos.value.filter(r => r.active).length,
  inativos: requisitos.value.filter(r => !r.active).length,
}))

const filtered = computed(() => {
  let result = requisitos.value
  if (activeFilter.value === 'ativo') result = result.filter(r => r.active)
  else if (activeFilter.value === 'inativo') result = result.filter(r => !r.active)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q),
    )
  }
  return result
})

function isInactivatingRequisito() {
  const original = requisitos.value.find(r => r.id === editingId.value)
  return sheetMode.value === 'edit' && original?.active !== false && !form.value.active
}

async function submitForm(confirmedInactive = false) {
  submitError.value = null
  if (isInactivatingRequisito() && !confirmedInactive) {
    confirmInactiveOpen.value = true
    return
  }
  confirmInactiveOpen.value = false
  try {
    if (sheetMode.value === 'edit' && editingId.value) {
      await requisitoService.atualizar(editingId.value, {
        name: form.value.name, description: form.value.description || null, active: form.value.active,
      })
      toast.success('Requisito atualizado.')
    } else {
      const res = await requisitoService.criar({
        name: form.value.name, description: form.value.description || null, active: form.value.active,
      })
      if (res.status === 201) toast.success('Requisito cadastrado com sucesso.')
    }
    sheetOpen.value = false
  } catch (error) {
    const msg = getApiErrorMessage(error, 'Nao foi possivel salvar o requisito.')
    submitError.value = msg; toast.error(msg); return
  }
  try { await refreshRequisitos() } catch (error) {
    const msg = getApiErrorMessage(error, 'Salvo, mas nao foi possivel atualizar a lista.')
    submitError.value = msg; toast.error(msg)
  }
}

const filters = [
  { key: 'todos', label: 'Todos' },
  { key: 'ativo', label: 'Ativos' },
  { key: 'inativo', label: 'Inativos' },
] as const

onMounted(() => { void ensureRequisitosLoaded() })
</script>

<template>
  <div class="nd-page">


    <Dialog v-model:open="sheetOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="nd-dialog-title">{{ sheetMode === 'edit' ? 'Editar requisito' : 'Novo requisito' }}</DialogTitle>
          <DialogDescription class="sr-only">{{ sheetMode === 'edit' ? 'Editar requisito' : 'Novo requisito' }}</DialogDescription>
        </DialogHeader>
        <form class="nd-form" @submit.prevent="submitForm()">
          <div class="nd-field col-span-full">
            <label class="nd-field-label">Nome *</label>
            <input v-model="form.name" class="nd-field-input" placeholder="Nome do requisito" required />
          </div>
          <div class="nd-field col-span-full">
            <label class="nd-field-label">DESCRIÇÃO</label>
            <textarea v-model="form.description" class="nd-field-input nd-field-textarea" placeholder="Descrição opcional" rows="3" />
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
              {{ sheetMode === 'edit' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR REQUISITO' }}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <ConfirmActionDialog
      v-model:open="confirmInactiveOpen"
      title="Inativar requisito?"
      description="Este requisito ficara inativo e deixara de aparecer como opcao ativa em novos contratos."
      confirm-label="Inativar"
      destructive
      @confirm="submitForm(true)"
    />

    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="nd-dialog-title">Detalhes do requisito</DialogTitle>
          <DialogDescription class="sr-only">Detalhes do requisito</DialogDescription>
        </DialogHeader>
        <div v-if="detailItem" class="nd-detail">
          <div class="nd-detail-status-row">
            <span class="nd-tag nd-tag--lg" :style="detailItem.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ detailItem.active ? 'Ativo' : 'Inativo' }}</span>
          </div>
          <div class="nd-detail-section">
            <span class="nd-field-label">Nome</span>
            <span class="nd-detail-value">{{ detailItem.name }}</span>
          </div>
          <div v-if="detailItem.description" class="nd-detail-section">
            <span class="nd-field-label">DESCRIÇÃO</span>
            <span class="nd-detail-value nd-detail-value--secondary">{{ detailItem.description }}</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <button type="button" class="nd-btn-secondary">FECHAR</button>
          </DialogClose>
          <button class="nd-btn-primary" type="button" @click="openEditFromDetail">
            <Pencil :size="12" /> Editar requisito
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <div v-if="erro" class="nd-error">{{ erro }}</div>

    <div class="nd-stats-row">
      <div class="nd-stat">
        <span class="nd-stat-val">{{ String(requisitos.length).padStart(2, '0') }}</span>
        <span class="nd-label">Total</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-success)">{{ String(counts.ativos).padStart(2, '0') }}</span>
        <span class="nd-label">Ativos</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-accent)">{{ String(counts.inativos).padStart(2, '0') }}</span>
        <span class="nd-label">Inativos</span>
      </div>
      <button class="nd-btn-primary nd-btn-desktop" style="margin-left: auto" @click="openCreate">
        <Plus :size="12" /> Novo requisito
      </button>
    </div>

    <button class="nd-fab" @click="openCreate" aria-label="Novo requisito">
      <Plus :size="20" />
    </button>

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
          <col style="width:30%; min-width:160px"><col><col style="width:100px"><col style="width:44px">
        </colgroup>
        <thead>
          <tr>
            <th class="nd-th">REQUISITO</th>
            <th class="nd-th">DESCRIÇÃO</th>
            <th class="nd-th nd-th--status">STATUS</th>
            <th class="nd-th" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="4" class="nd-empty">Carregando...</td></tr>
          <tr v-for="r in filtered" :key="r.id" class="nd-tr nd-tr--clickable" @click="openDetail(r)">
            <td class="nd-td nd-td--primary">{{ r.name }}</td>
            <td class="nd-td nd-td--secondary">{{ r.description ?? '—' }}</td>
            <td class="nd-td nd-td--status">
              <span class="nd-tag" :style="r.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ r.active ? 'Ativo' : 'Inativo' }}</span>
            </td>
            <td class="nd-td nd-td--action">
              <button class="nd-edit-btn" type="button" @click.stop="openEdit(r)"><Pencil :size="12" /></button>
            </td>
          </tr>
          <tr v-if="!loading && filtered.length === 0"><td colspan="4" class="nd-empty">Nenhum requisito cadastrado</td></tr>
        </tbody>
      </table>
    </div>

    <div v-else class="nd-grid">
      <div v-if="loading" class="nd-empty nd-empty--grid">Carregando...</div>
      <div v-for="r in filtered" :key="r.id" class="nd-card" @click="openDetail(r)">
        <div class="nd-card-top-row">
          <span class="nd-card-cat">Requisito</span>
          <button class="nd-card-edit-btn" type="button" @click.stop="openEdit(r)"><Pencil :size="11" /></button>
        </div>
        <p class="nd-card-name">{{ r.name }}</p>
        <p v-if="r.description" class="nd-card-desc">{{ r.description }}</p>
        <div class="nd-card-footer">
          <span class="nd-tag" :style="r.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ r.active ? 'Ativo' : 'Inativo' }}</span>
        </div>
      </div>
      <div v-if="!loading && filtered.length === 0" class="nd-empty nd-empty--grid">Nenhum requisito cadastrado</div>
    </div>

  </div>
</template>

<style scoped>
.nd-page { display: flex; flex-direction: column; gap: 0; min-height: 100%; }
.nd-error { font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-accent); margin-bottom: 16px; }
.nd-label { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.01em; font-weight: 500; color: var(--nd-text-secondary); line-height: 1.2; }
.nd-stats-row { display: flex; align-items: center; gap: 20px; padding: 16px; border: 1px solid var(--nd-border); border-radius: 8px; background: var(--nd-surface); box-shadow: var(--nd-shadow-card); margin-bottom: 32px; }
.nd-stat { display: flex; flex-direction: column; gap: 4px; }
.nd-stat-val { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 400; letter-spacing: 0; color: var(--nd-text-display); line-height: 1.1; }
.nd-stat-sep { width: 1px; height: 28px; background: var(--nd-border-visible); }
.nd-controls-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.nd-controls-right { display: flex; align-items: center; gap: 16px; }
.nd-segmented { display: flex; border: 1px solid var(--nd-border-visible); border-radius: 8px; overflow: hidden; background: var(--nd-surface); }
.nd-seg-btn { font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 0.02em; font-weight: 500; background: transparent; color: var(--nd-text-disabled); border: none; padding: 7px 14px; cursor: pointer; transition: color 150ms ease-out, background 150ms ease-out; }
.nd-seg-btn:hover { color: var(--nd-text-secondary); }
.nd-seg-btn--active { background: var(--nd-text-display); color: var(--nd-bg); }
.nd-search { display: flex; align-items: center; gap: 8px; border: 1px solid var(--nd-border-visible); border-radius: 8px; background: var(--nd-surface); padding: 0 10px; min-height: 40px; }
.nd-search-icon { color: var(--nd-text-disabled); }
.nd-search-input { background: transparent; border: none; outline: none; font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 0.01em; color: var(--nd-text-primary); width: 180px; }
.nd-search-input::placeholder { color: var(--nd-text-disabled); }
.nd-table-wrap { overflow-x: auto; background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 8px; box-shadow: var(--nd-shadow-card); }
.nd-table { width: 100%; border-collapse: collapse; min-width: 760px; }
.nd-th { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 700; color: var(--nd-text-secondary); text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--nd-border-visible); background: var(--nd-surface-soft); white-space: nowrap; }
.nd-th--status { padding-left: 20px; padding-right: 0; }
.nd-tr { border-bottom: 1px solid var(--nd-border); transition: background 150ms ease-out; }
.nd-tr:hover { background: var(--nd-surface-raised); }
.nd-tr:hover .nd-edit-btn { opacity: 1; }
.nd-tr--clickable { cursor: pointer; }
.nd-td { padding: 14px 16px; font-family: 'Inter', sans-serif; font-size: 14px; color: var(--nd-text-secondary); vertical-align: middle; }
.nd-td--primary { color: var(--nd-text-primary); }
.nd-td--secondary { color: var(--nd-text-secondary); }
.nd-td--status { padding-left: 20px; padding-right: 0; }
.nd-td--action { padding-right: 16px; width: 52px; }
.nd-edit-btn { opacity: 1; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 8px; cursor: pointer; color: var(--nd-text-secondary); transition: opacity 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out; }
.nd-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-empty { padding: 48px 0; font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-text-disabled); text-align: center; }
.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.nd-empty--grid { grid-column: 1 / -1; }
.nd-card { background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 8px; padding: 16px; cursor: pointer; transition: border-color 150ms ease-out, box-shadow 150ms ease-out, transform 150ms ease-out; display: flex; flex-direction: column; box-shadow: var(--nd-shadow-card); }
.nd-card:hover { border-color: var(--nd-action); box-shadow: var(--nd-shadow-popover); transform: translateY(-1px); }
.nd-card-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
.nd-card-cat { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.03em; color: var(--nd-text-disabled); }
.nd-card-edit-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 8px; cursor: pointer; color: var(--nd-text-secondary); transition: color 150ms ease-out, border-color 150ms ease-out; }
.nd-card-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-card-name { font-family: 'Inter', sans-serif; font-size: 15px; color: var(--nd-text-primary); margin: 6px 0 4px; line-height: 1.3; }
.nd-card-desc { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--nd-text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; flex: 1; }
.nd-card-footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--nd-border); }


.nd-fab { display: none; }

@media (max-width: 640px) {
  .nd-controls-row { flex-direction: column; align-items: stretch; gap: 12px; }
  .nd-controls-right { justify-content: space-between; }
  .nd-search { flex: 1; }
  .nd-search-input { width: 100%; min-width: 0; }
  .nd-grid { grid-template-columns: 1fr; }
  .nd-btn-desktop { display: none; }
  .nd-fab { display: flex; align-items: center; justify-content: center; position: fixed; bottom: 24px; right: 24px; width: 52px; height: 52px; border-radius: 50%; background: var(--nd-action); color: var(--nd-action-foreground); border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.4); transition: background-color 150ms ease-out; z-index: 50; }
  .nd-fab:hover { background: var(--nd-action-hover); }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .nd-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Horizontal list cards */
.nd-grid { grid-template-columns: 1fr; gap: 10px; }
.nd-card { display: grid; grid-template-columns: minmax(108px, 0.7fr) minmax(180px, 1.4fr) minmax(150px, 1fr) auto; align-items: center; gap: 16px; min-height: 72px; padding: 14px 16px; }
.nd-card-top,
.nd-card-top-row { min-width: 0; margin: 0; align-self: center; }
.nd-card-name { min-width: 0; margin: 0; font-size: 14px; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nd-card-meta,
.nd-card-dates { min-width: 0; display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 6px 14px; }
.nd-card-detail,
.nd-card-email,
.nd-card-desc,
.nd-card-tipo,
.nd-card-tecnicos,
.nd-card-date-val,
.nd-card-meta-item { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nd-card-desc { display: block; -webkit-line-clamp: unset; -webkit-box-orient: initial; margin: 0; }
.nd-card-footer { margin: 0; padding: 0; border-top: 0; justify-content: flex-end; align-items: center; gap: 8px; }
.nd-card-edit-btn { flex-shrink: 0; }

@media (max-width: 760px) {
  .nd-card { grid-template-columns: 1fr auto; align-items: start; gap: 8px 12px; }
  .nd-card-name,
  .nd-card-meta,
  .nd-card-dates,
  .nd-card-desc { grid-column: 1 / -1; }
  .nd-card-footer { grid-column: 1 / -1; justify-content: flex-start; padding-top: 10px; border-top: 1px solid var(--nd-border); }
  .nd-card-name,
  .nd-card-detail,
  .nd-card-email,
  .nd-card-desc,
  .nd-card-tipo,
  .nd-card-tecnicos { white-space: normal; }
}

</style>
