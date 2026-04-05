<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Search, Plus, Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { requisitoService, type RequisitoAPI } from '@/shared/services/requisitoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { useRequisitosStore } from '@/shared/composables/useRequisitosStore'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import ViewToggle from '@/shared/components/ui/ViewToggle.vue'

const searchQuery = ref('')
const activeFilter = ref<'todos' | 'ativo' | 'inativo'>('todos')
const viewMode = ref<'table' | 'grid'>('table')
const sheetOpen = ref(false)
const sheetMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const submitError = ref<string | null>(null)

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

async function submitForm() {
  submitError.value = null
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
  { key: 'todos', label: 'TODOS' },
  { key: 'ativo', label: 'ATIVOS' },
  { key: 'inativo', label: 'INATIVOS' },
] as const

onMounted(() => { void ensureRequisitosLoaded() })
</script>

<template>
  <div class="nd-page">

    <div class="nd-action-row">
      <button class="nd-btn-primary" @click="openCreate">
        <Plus :size="12" /> NOVO REQUISITO
      </button>
    </div>

    <Sheet v-model:open="sheetOpen">
      <SheetContent class="nd-sheet">
        <SheetHeader class="nd-sheet-header">
          <SheetTitle class="nd-sheet-title">{{ sheetMode === 'edit' ? 'EDITAR REQUISITO' : 'NOVO REQUISITO' }}</SheetTitle>
          <SheetDescription class="sr-only">{{ sheetMode === 'edit' ? 'Editar requisito' : 'Novo requisito' }}</SheetDescription>
        </SheetHeader>
        <form class="nd-form" @submit.prevent="submitForm">
          <div class="nd-field">
            <label class="nd-field-label">NOME *</label>
            <input v-model="form.name" class="nd-field-input" placeholder="Nome do requisito" required />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">DESCRIÇÃO</label>
            <textarea v-model="form.description" class="nd-field-input nd-field-textarea" placeholder="Descrição opcional" rows="3" />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">STATUS</label>
            <div class="nd-toggle-row">
              <button type="button" class="nd-toggle" :class="{ 'nd-toggle--on': form.active }" @click="form.active = !form.active">
                <span class="nd-toggle-thumb" />
              </button>
              <span class="nd-toggle-label">{{ form.active ? 'ATIVO' : 'INATIVO' }}</span>
            </div>
          </div>
          <div v-if="submitError" class="nd-field-error">{{ submitError }}</div>
          <div class="nd-form-footer">
            <button type="submit" class="nd-btn-primary nd-btn-full">
              {{ sheetMode === 'edit' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR REQUISITO' }}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <div v-if="erro" class="nd-error">{{ erro }}</div>

    <div class="nd-hero">
      <div class="nd-hero-number">
        <span v-if="loading">—</span>
        <span v-else>{{ String(requisitos.length).padStart(2, '0') }}</span>
      </div>
      <span class="nd-label">REQUISITOS CADASTRADOS</span>
    </div>

    <div class="nd-stats-row">
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-success)">{{ String(counts.ativos).padStart(2, '0') }}</span>
        <span class="nd-label">ATIVOS</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-accent)">{{ String(counts.inativos).padStart(2, '0') }}</span>
        <span class="nd-label">INATIVOS</span>
      </div>
    </div>

    <div class="nd-controls-row">
      <div class="nd-segmented">
        <button v-for="f in filters" :key="f.key" class="nd-seg-btn" :class="{ 'nd-seg-btn--active': activeFilter === f.key }" @click="activeFilter = f.key">{{ f.label }}</button>
      </div>
      <div class="nd-controls-right">
        <div class="nd-search">
          <Search :size="13" class="nd-search-icon" />
          <input v-model="searchQuery" type="text" placeholder="BUSCAR..." class="nd-search-input" />
        </div>
        <ViewToggle v-model="viewMode" />
      </div>
    </div>

    <!-- TABLE VIEW -->
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
          <tr v-if="loading"><td colspan="4" class="nd-empty">CARREGANDO...</td></tr>
          <tr v-for="r in filtered" :key="r.id" class="nd-tr">
            <td class="nd-td nd-td--primary">{{ r.name }}</td>
            <td class="nd-td nd-td--secondary">{{ r.description ?? '—' }}</td>
            <td class="nd-td nd-td--status">
              <span class="nd-tag" :style="r.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ r.active ? 'ATIVO' : 'INATIVO' }}</span>
            </td>
            <td class="nd-td nd-td--action">
              <button class="nd-edit-btn" type="button" @click="openEdit(r)"><Pencil :size="12" /></button>
            </td>
          </tr>
          <tr v-if="!loading && filtered.length === 0"><td colspan="4" class="nd-empty">NENHUM REQUISITO CADASTRADO</td></tr>
        </tbody>
      </table>
    </div>

    <!-- GRID VIEW -->
    <div v-else class="nd-grid">
      <div v-if="loading" class="nd-empty nd-empty--grid">CARREGANDO...</div>
      <div v-for="r in filtered" :key="r.id" class="nd-card" @click="openEdit(r)">
        <span class="nd-card-cat">REQUISITO</span>
        <p class="nd-card-name">{{ r.name }}</p>
        <p v-if="r.description" class="nd-card-desc">{{ r.description }}</p>
        <div class="nd-card-footer">
          <span class="nd-tag" :style="r.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ r.active ? 'ATIVO' : 'INATIVO' }}</span>
        </div>
      </div>
      <div v-if="!loading && filtered.length === 0" class="nd-empty nd-empty--grid">NENHUM REQUISITO CADASTRADO</div>
    </div>

  </div>
</template>

<style scoped>
.nd-page { display: flex; flex-direction: column; gap: 0; min-height: 100%; }
.nd-action-row { display: flex; justify-content: flex-end; margin-bottom: 40px; }
.nd-error { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.08em; color: var(--nd-accent); margin-bottom: 16px; }
.nd-label { font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; color: var(--nd-text-secondary); line-height: 1.2; }
.nd-hero { display: flex; flex-direction: column; gap: 6px; margin-bottom: 32px; }
.nd-hero-number { font-family: 'Space Mono', monospace; font-size: 80px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.0; color: var(--nd-text-display); }
.nd-stats-row { display: flex; align-items: center; gap: 24px; padding: 20px 0; border-top: 1px solid var(--nd-border); border-bottom: 1px solid var(--nd-border); margin-bottom: 32px; }
.nd-stat { display: flex; flex-direction: column; gap: 4px; }
.nd-stat-val { font-family: 'Space Mono', monospace; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; color: var(--nd-text-display); line-height: 1.1; }
.nd-stat-sep { width: 1px; height: 28px; background: var(--nd-border-visible); }
.nd-controls-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.nd-controls-right { display: flex; align-items: center; gap: 16px; }
.nd-segmented { display: flex; border: 1px solid var(--nd-border-visible); border-radius: 999px; overflow: hidden; }
.nd-seg-btn { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; background: transparent; color: var(--nd-text-disabled); border: none; padding: 7px 14px; cursor: pointer; transition: color 150ms ease-out, background 150ms ease-out; }
.nd-seg-btn:hover { color: var(--nd-text-secondary); }
.nd-seg-btn--active { background: var(--nd-text-display); color: var(--nd-bg); }
.nd-search { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--nd-border-visible); padding-bottom: 6px; }
.nd-search-icon { color: var(--nd-text-disabled); }
.nd-search-input { background: transparent; border: none; outline: none; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.06em; color: var(--nd-text-primary); width: 180px; }
.nd-search-input::placeholder { color: var(--nd-text-disabled); }
.nd-table-wrap { overflow-x: auto; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-th { font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; color: var(--nd-text-secondary); text-align: left; padding: 0 16px 10px 0; border-bottom: 1px solid var(--nd-border-visible); white-space: nowrap; }
.nd-th--status { padding-left: 20px; padding-right: 0; }
.nd-tr { border-bottom: 1px solid var(--nd-border); transition: background 150ms ease-out; }
.nd-tr:hover { background: var(--nd-surface); }
.nd-tr:hover .nd-edit-btn { opacity: 1; }
.nd-td { padding: 13px 16px 13px 0; font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: var(--nd-text-secondary); vertical-align: middle; }
.nd-td--primary { color: var(--nd-text-primary); }
.nd-td--secondary { color: var(--nd-text-secondary); }
.nd-td--status { padding-left: 20px; padding-right: 0; }
.nd-td--action { padding-right: 0; width: 44px; }
.nd-edit-btn { opacity: 0; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 6px; cursor: pointer; color: var(--nd-text-secondary); transition: opacity 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out; }
.nd-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-tag { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 8px; border: 1px solid; border-radius: 999px; white-space: nowrap; }
.nd-empty { padding: 48px 0; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.08em; color: var(--nd-text-disabled); text-align: center; }
.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.nd-empty--grid { grid-column: 1 / -1; }
.nd-card { background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color 150ms ease-out; display: flex; flex-direction: column; }
.nd-card:hover { border-color: var(--nd-border-visible); }
.nd-card-cat { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--nd-text-disabled); }
.nd-card-name { font-family: 'Space Grotesk', sans-serif; font-size: 15px; color: var(--nd-text-primary); margin: 6px 0 4px; line-height: 1.3; }
.nd-card-desc { font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: var(--nd-text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; flex: 1; }
.nd-card-footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--nd-border); }
:deep(.nd-sheet) { background: var(--nd-surface) !important; border-left: 1px solid var(--nd-border-visible) !important; padding: 32px 28px; }
.nd-sheet-header { margin-bottom: 32px; }
.nd-sheet-title { font-family: 'Space Mono', monospace !important; font-size: 13px !important; font-weight: 400 !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; color: var(--nd-text-display) !important; }
.nd-form { display: flex; flex-direction: column; gap: 24px; }
.nd-field { display: flex; flex-direction: column; gap: 8px; }
.nd-field-label { font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; color: var(--nd-text-disabled); }
.nd-field-input { background: transparent; border: none; border-bottom: 1px solid var(--nd-border-visible); outline: none; padding: 8px 0; font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: var(--nd-text-primary); transition: border-color 150ms ease-out; width: 100%; }
.nd-field-input:focus { border-bottom-color: var(--nd-text-primary); }
.nd-field-textarea { resize: none; line-height: 1.5; }
.nd-field-error { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.06em; color: var(--nd-accent); }
.nd-toggle-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
.nd-toggle { position: relative; width: 40px; height: 22px; border: none; border-radius: 999px; background: var(--nd-border-visible); cursor: pointer; transition: background 200ms ease-out; }
.nd-toggle--on { background: var(--nd-text-display); }
.nd-toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--nd-text-disabled); transition: transform 200ms ease-out, background 200ms ease-out; }
.nd-toggle--on .nd-toggle-thumb { transform: translateX(18px); background: var(--nd-bg); }
.nd-toggle-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--nd-text-secondary); }
.nd-btn-primary { display: flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; background: var(--nd-action); color: var(--nd-action-foreground); border: none; border-radius: 999px; padding: 8px 16px; cursor: pointer; transition: background-color 150ms ease-out; }
.nd-btn-primary:hover { background: var(--nd-action-hover); }
.nd-btn-full { width: 100%; justify-content: center; }
.nd-form-footer { margin-top: 16px; }

@media (max-width: 640px) {
  .nd-controls-row { flex-direction: column; align-items: stretch; gap: 12px; }
  .nd-controls-right { justify-content: space-between; }
  .nd-search { flex: 1; }
  .nd-search-input { width: 100%; min-width: 0; }
  .nd-grid { grid-template-columns: 1fr; }
  .nd-hero-number { font-size: 56px; }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .nd-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
