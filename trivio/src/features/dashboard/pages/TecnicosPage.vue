<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Search, Plus, Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { useTecnicosStore } from '@/shared/composables/useTecnicosStore'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import ViewToggle from '@/shared/components/ui/ViewToggle.vue'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'

const searchQuery = ref('')
const activeFilter = ref<'todos' | 'ativo' | 'inativo'>('todos')
const viewMode = ref<'table' | 'grid'>('table')
const sheetOpen = ref(false)
const sheetMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const submitError = ref<string | null>(null)

const {
  items: tecnicos,
  loading,
  error: loadError,
  ensureLoaded: ensureTecnicosLoaded,
  refresh: refreshTecnicos,
} = useTecnicosStore()

const erro = computed(() => submitError.value ?? loadError.value)

const detailOpen = ref(false)
const detailItem = ref<TecnicoAPI | null>(null)

function openDetail(t: TecnicoAPI) { detailItem.value = t; detailOpen.value = true }
function openEditFromDetail() {
  if (!detailItem.value) return
  const t = detailItem.value; detailOpen.value = false; openEdit(t)
}

const form = ref({ name: '', email: '', password: '', admin: false, active: true })

function resetForm() {
  form.value = { name: '', email: '', password: '', admin: false, active: true }
}

function openCreate() {
  resetForm(); editingId.value = null; sheetMode.value = 'create'; sheetOpen.value = true
}

function openEdit(t: TecnicoAPI) {
  form.value = { name: t.name, email: t.email, password: '', admin: t.admin, active: t.active }
  editingId.value = t.employeeId; sheetMode.value = 'edit'; sheetOpen.value = true
}

watch(sheetOpen, open => {
  if (!open) { resetForm(); editingId.value = null; submitError.value = null }
})

const counts = computed(() => ({
  ativos: tecnicos.value.filter(t => t.active).length,
  inativos: tecnicos.value.filter(t => !t.active).length,
  admins: tecnicos.value.filter(t => t.admin).length,
  total: tecnicos.value.length,
}))

const filtered = computed(() => {
  let result = tecnicos.value
  if (activeFilter.value === 'ativo') result = result.filter(t => t.active)
  else if (activeFilter.value === 'inativo') result = result.filter(t => !t.active)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q))
  }
  return result
})

async function submitForm() {
  submitError.value = null
  try {
    if (sheetMode.value === 'edit' && editingId.value) {
      const payload: Omit<TecnicoAPI, 'employeeId'> = {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password || undefined,
        admin: form.value.admin,
        active: form.value.active,
      }
      await tecnicoService.atualizar(editingId.value, payload)
      toast.success('Colaborador atualizado.')
    } else {
      const res = await tecnicoService.criar({
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        admin: form.value.admin,
        active: form.value.active,
      })
      if (res.status === 201) toast.success('Colaborador criado com sucesso.')
    }
    sheetOpen.value = false
  } catch (error) {
    const msg = getApiErrorMessage(error, 'Nao foi possivel salvar o colaborador.')
    submitError.value = msg; toast.error(msg); return
  }
  try { await refreshTecnicos() } catch (error) {
    const msg = getApiErrorMessage(error, 'Salvo, mas nao foi possivel atualizar a lista.')
    submitError.value = msg; toast.error(msg)
  }
}

const filters = [
  { key: 'todos', label: 'TODOS' },
  { key: 'ativo', label: 'ATIVOS' },
  { key: 'inativo', label: 'INATIVOS' },
] as const

const funcaoOptions = [
  { value: 'false', label: 'TÉCNICO' },
  { value: 'true', label: 'ADMINISTRADOR' },
]

const adminValue = computed({
  get: () => form.value.admin ? 'true' : 'false',
  set: (v: string | number | null) => { form.value.admin = v === 'true' },
})

onMounted(() => { void ensureTecnicosLoaded() })
</script>

<template>
  <div class="nd-page">

    <div class="nd-action-row">
      <button class="nd-btn-primary" @click="openCreate">
        <Plus :size="12" /> CADASTRAR TÉCNICO
      </button>
    </div>

    <Sheet v-model:open="sheetOpen">
      <SheetContent class="nd-sheet">
        <SheetHeader class="nd-sheet-header">
          <SheetTitle class="nd-sheet-title">{{ sheetMode === 'edit' ? 'EDITAR COLABORADOR' : 'CADASTRAR TÉCNICO' }}</SheetTitle>
          <SheetDescription class="sr-only">{{ sheetMode === 'edit' ? 'Editar colaborador' : 'Cadastrar técnico' }}</SheetDescription>
        </SheetHeader>
        <form class="nd-form" @submit.prevent="submitForm">
          <div class="nd-field">
            <label class="nd-field-label">NOME *</label>
            <input v-model="form.name" class="nd-field-input" placeholder="Nome completo" required />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">E-MAIL *</label>
            <input v-model="form.email" type="email" class="nd-field-input" placeholder="email@empresa.com" required />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">{{ sheetMode === 'edit' ? 'NOVA SENHA (OPCIONAL)' : 'SENHA *' }}</label>
            <input v-model="form.password" type="password" class="nd-field-input" placeholder="Senha de acesso" :required="sheetMode === 'create'" />
          </div>
          <div class="nd-field">
            <label class="nd-field-label">FUNÇÃO</label>
            <NdCombobox v-model="adminValue" :options="funcaoOptions" placeholder="Selecione a função" />
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
              {{ sheetMode === 'edit' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR' }}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <!-- DETAIL SHEET -->
    <Sheet v-model:open="detailOpen">
      <SheetContent class="nd-sheet nd-sheet--detail">
        <SheetHeader class="nd-sheet-header">
          <SheetTitle class="nd-sheet-title">DETALHES DO COLABORADOR</SheetTitle>
          <SheetDescription class="sr-only">Detalhes do colaborador</SheetDescription>
        </SheetHeader>
        <div v-if="detailItem" class="nd-detail">
          <div class="nd-detail-status-row">
            <span class="nd-tag nd-tag--lg" :style="detailItem.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ detailItem.active ? 'ATIVO' : 'INATIVO' }}</span>
            <span class="nd-role" :class="detailItem.admin ? 'nd-role--admin' : 'nd-role--tech'">{{ detailItem.admin ? 'ADMINISTRADOR' : 'TÉCNICO' }}</span>
          </div>
          <div class="nd-detail-section">
            <span class="nd-field-label">NOME</span>
            <span class="nd-detail-value">{{ detailItem.name }}</span>
          </div>
          <div class="nd-detail-section">
            <span class="nd-field-label">E-MAIL</span>
            <span class="nd-detail-value nd-detail-value--secondary">{{ detailItem.email }}</span>
          </div>
          <div class="nd-detail-footer">
            <button class="nd-btn-primary nd-btn-full" type="button" @click="openEditFromDetail">
              <Pencil :size="12" /> EDITAR COLABORADOR
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <div v-if="erro" class="nd-error">{{ erro }}</div>

    <div class="nd-hero">
      <div class="nd-hero-fraction">
        <span class="nd-hero-available">{{ counts.ativos }}</span>
        <span class="nd-hero-slash">/</span>
        <span class="nd-hero-total">{{ counts.total }}</span>
      </div>
      <div class="nd-hero-meta">
        <span class="nd-label" style="color: var(--nd-success)">COLABORADORES ATIVOS</span>
      </div>
    </div>

    <div class="nd-stats-row">
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-success)">{{ counts.ativos }}</span>
        <span class="nd-label">ATIVOS</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val" style="color: var(--nd-accent)">{{ counts.inativos }}</span>
        <span class="nd-label">INATIVOS</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val">{{ counts.admins }}</span>
        <span class="nd-label">ADMINS</span>
      </div>
      <div class="nd-stat-sep" />
      <div class="nd-stat">
        <span class="nd-stat-val">{{ counts.total }}</span>
        <span class="nd-label">TOTAL</span>
      </div>
    </div>

    <div class="nd-controls-row">
      <div class="nd-segmented">
        <button v-for="f in filters" :key="f.key" class="nd-seg-btn" :class="{ 'nd-seg-btn--active': activeFilter === f.key }" @click="activeFilter = f.key">{{ f.label }}</button>
      </div>
      <div class="nd-controls-right">
        <div class="nd-search">
          <Search :size="13" class="nd-search-icon" />
          <input v-model="searchQuery" type="text" placeholder="BUSCAR TÉCNICO..." class="nd-search-input" />
        </div>
        <ViewToggle v-model="viewMode" />
      </div>
    </div>

    <!-- TABLE VIEW -->
    <div v-if="viewMode === 'table'" class="nd-table-wrap">
      <table class="nd-table">
        <colgroup>
          <col><col><col style="width:130px"><col style="width:90px"><col style="width:44px">
        </colgroup>
        <thead>
          <tr>
            <th class="nd-th">NOME</th>
            <th class="nd-th">E-MAIL</th>
            <th class="nd-th">FUNÇÃO</th>
            <th class="nd-th">STATUS</th>
            <th class="nd-th" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="5" class="nd-empty">CARREGANDO...</td></tr>
          <tr v-for="t in filtered" :key="t.employeeId" class="nd-tr nd-tr--clickable" @click="openDetail(t)">
            <td class="nd-td nd-td--primary">{{ t.name }}</td>
            <td class="nd-td nd-td--secondary">{{ t.email }}</td>
            <td class="nd-td">
              <span class="nd-role" :class="t.admin ? 'nd-role--admin' : 'nd-role--tech'">{{ t.admin ? 'ADMINISTRADOR' : 'TÉCNICO' }}</span>
            </td>
            <td class="nd-td">
              <span class="nd-tag" :style="t.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ t.active ? 'ATIVO' : 'INATIVO' }}</span>
            </td>
            <td class="nd-td nd-td--action">
              <button class="nd-edit-btn" type="button" @click.stop="openEdit(t)"><Pencil :size="12" /></button>
            </td>
          </tr>
          <tr v-if="!loading && filtered.length === 0"><td colspan="5" class="nd-empty">NENHUM COLABORADOR CADASTRADO</td></tr>
        </tbody>
      </table>
    </div>

    <!-- GRID VIEW -->
    <div v-else class="nd-grid">
      <div v-if="loading" class="nd-empty nd-empty--grid">CARREGANDO...</div>
      <div v-for="t in filtered" :key="t.employeeId" class="nd-card" @click="openDetail(t)">
        <div class="nd-card-top-row">
          <span class="nd-card-cat">COLABORADOR</span>
          <button class="nd-card-edit-btn" type="button" @click.stop="openEdit(t)"><Pencil :size="11" /></button>
        </div>
        <p class="nd-card-name">{{ t.name }}</p>
        <span class="nd-card-email">{{ t.email }}</span>
        <div class="nd-card-footer">
          <span class="nd-role" :class="t.admin ? 'nd-role--admin' : 'nd-role--tech'">{{ t.admin ? 'ADMINISTRADOR' : 'TÉCNICO' }}</span>
          <span class="nd-tag" :style="t.active ? { color: 'var(--nd-success)', borderColor: 'var(--nd-success)' } : { color: 'var(--nd-accent)', borderColor: 'var(--nd-accent)' }">{{ t.active ? 'ATIVO' : 'INATIVO' }}</span>
        </div>
      </div>
      <div v-if="!loading && filtered.length === 0" class="nd-empty nd-empty--grid">NENHUM COLABORADOR CADASTRADO</div>
    </div>

  </div>
</template>

<style scoped>
.nd-page { display: flex; flex-direction: column; min-height: 100%; }
.nd-action-row { display: flex; justify-content: flex-end; margin-bottom: 40px; }
.nd-error { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.08em; color: var(--nd-accent); margin-bottom: 16px; }
.nd-label { font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; color: var(--nd-text-secondary); line-height: 1.2; }
.nd-hero { display: flex; align-items: flex-end; gap: 20px; margin-bottom: 32px; }
.nd-hero-fraction { display: flex; align-items: baseline; line-height: 1.0; }
.nd-hero-available { font-family: 'Space Mono', monospace; font-size: 80px; font-weight: 400; letter-spacing: -0.02em; color: var(--nd-success); }
.nd-hero-slash { font-family: 'Space Mono', monospace; font-size: 40px; color: var(--nd-border-visible); margin: 0 4px; letter-spacing: -0.02em; }
.nd-hero-total { font-family: 'Space Mono', monospace; font-size: 40px; font-weight: 400; letter-spacing: -0.02em; color: var(--nd-text-secondary); }
.nd-hero-meta { padding-bottom: 10px; }
.nd-stats-row { display: flex; align-items: center; gap: 24px; padding: 20px 0; border-top: 1px solid var(--nd-border); border-bottom: 1px solid var(--nd-border); margin-bottom: 28px; }
.nd-stat { display: flex; flex-direction: column; gap: 4px; }
.nd-stat-val { font-family: 'Space Mono', monospace; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; color: var(--nd-text-display); line-height: 1.1; }
.nd-stat-sep { width: 1px; height: 28px; background: var(--nd-border-visible); }
.nd-controls-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.nd-controls-right { display: flex; align-items: center; gap: 16px; }
.nd-segmented { display: flex; border: 1px solid var(--nd-border-visible); border-radius: 999px; overflow: hidden; }
.nd-seg-btn { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; background: transparent; color: var(--nd-text-disabled); border: none; padding: 7px 14px; cursor: pointer; transition: color 150ms ease-out, background 150ms ease-out; white-space: nowrap; }
.nd-seg-btn:hover { color: var(--nd-text-secondary); }
.nd-seg-btn--active { background: var(--nd-text-display); color: var(--nd-bg); }
.nd-search { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--nd-border-visible); padding-bottom: 6px; }
.nd-search-icon { color: var(--nd-text-disabled); }
.nd-search-input { background: transparent; border: none; outline: none; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.06em; color: var(--nd-text-primary); width: 200px; }
.nd-search-input::placeholder { color: var(--nd-text-disabled); }
.nd-table-wrap { overflow-x: auto; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-th { font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; color: var(--nd-text-secondary); text-align: left; padding: 0 16px 10px 0; border-bottom: 1px solid var(--nd-border-visible); white-space: nowrap; }
.nd-tr { border-bottom: 1px solid var(--nd-border); transition: background 150ms ease-out; }
.nd-tr:hover { background: var(--nd-surface); }
.nd-tr:hover .nd-edit-btn { opacity: 1; }
.nd-tr--clickable { cursor: pointer; }
.nd-td { padding: 13px 16px 13px 0; font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: var(--nd-text-secondary); vertical-align: middle; }
.nd-td--primary { color: var(--nd-text-primary); }
.nd-td--secondary { color: var(--nd-text-secondary); }
.nd-td--action { padding-right: 0; width: 44px; }
.nd-edit-btn { opacity: 0; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 6px; cursor: pointer; color: var(--nd-text-secondary); transition: opacity 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out; }
.nd-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-role { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 8px; border-radius: 3px; white-space: nowrap; }
.nd-role--admin { background: color-mix(in srgb, var(--nd-warning) 15%, transparent); color: var(--nd-warning); }
.nd-role--tech { background: color-mix(in srgb, var(--nd-text-secondary) 10%, transparent); color: var(--nd-text-secondary); }
.nd-tag { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 8px; border: 1px solid; border-radius: 999px; white-space: nowrap; }
.nd-empty { padding: 48px 0; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.08em; color: var(--nd-text-disabled); text-align: center; }
.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.nd-empty--grid { grid-column: 1 / -1; }
.nd-card { background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color 150ms ease-out; display: flex; flex-direction: column; gap: 4px; }
.nd-card:hover { border-color: var(--nd-border-visible); }
.nd-card-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
.nd-card-cat { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--nd-text-disabled); }
.nd-card-edit-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: transparent; border: 1px solid var(--nd-border-visible); border-radius: 6px; cursor: pointer; color: var(--nd-text-secondary); transition: color 150ms ease-out, border-color 150ms ease-out; }
.nd-card-edit-btn:hover { color: var(--nd-text-display); border-color: var(--nd-text-secondary); }
.nd-card-name { font-family: 'Space Grotesk', sans-serif; font-size: 15px; color: var(--nd-text-primary); margin: 4px 0 2px; line-height: 1.3; }
.nd-card-email { font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: var(--nd-text-secondary); flex: 1; }
.nd-card-footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--nd-border); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
:deep(.nd-sheet--detail) { background: var(--nd-surface) !important; border-left: 1px solid var(--nd-border-visible) !important; padding: 32px 28px; }
.nd-detail { display: flex; flex-direction: column; gap: 28px; }
.nd-detail-status-row { display: flex; align-items: center; gap: 12px; padding-bottom: 20px; border-bottom: 1px solid var(--nd-border); }
.nd-tag--lg { font-size: 11px; padding: 4px 12px; }
.nd-detail-section { display: flex; flex-direction: column; gap: 8px; }
.nd-detail-value { font-family: 'Space Grotesk', sans-serif; font-size: 16px; color: var(--nd-text-primary); }
.nd-detail-value--secondary { font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: var(--nd-text-secondary); }
.nd-detail-footer { margin-top: auto; padding-top: 20px; border-top: 1px solid var(--nd-border); }
:deep(.nd-sheet) { background: var(--nd-surface) !important; border-left: 1px solid var(--nd-border-visible) !important; padding: 32px 28px; }
.nd-sheet-header { margin-bottom: 32px; }
.nd-sheet-title { font-family: 'Space Mono', monospace !important; font-size: 13px !important; font-weight: 400 !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; color: var(--nd-text-display) !important; }
.nd-form { display: flex; flex-direction: column; gap: 24px; }
.nd-field { display: flex; flex-direction: column; gap: 8px; }
.nd-field-label { font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; color: var(--nd-text-disabled); }
.nd-field-input { background: transparent; border: none; border-bottom: 1px solid var(--nd-border-visible); outline: none; padding: 8px 0; font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: var(--nd-text-primary); transition: border-color 150ms ease-out; width: 100%; }
.nd-field-input:focus { border-bottom-color: var(--nd-text-primary); }
.nd-field-select { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; }
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
  .nd-hero-available { font-size: 56px; }
  .nd-hero-slash, .nd-hero-total { font-size: 28px; }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .nd-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
