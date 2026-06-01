<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { CheckSquare, Loader2, Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { useAuth } from '@/shared/composables/useAuth'
import { getApiErrorMessage } from '@/shared/services/api'
import { checklistService, type ChecklistAPI } from '@/shared/services/checklistService'

const props = defineProps<{
  maintenanceId: number
  canManage?: boolean
  canToggle?: boolean
  disabled?: boolean
}>()

const items = ref<ChecklistAPI[]>([])
const loading = ref(false)
const adding = ref(false)
const pendingIds = ref(new Set<number>())
const creating = ref(false)
const newDescription = ref('')
const editingItemId = ref<number | null>(null)
const editingDescription = ref('')
let loadRequestId = 0

const { currentUser } = useAuth()
const canManageItems = computed(() => props.canManage && currentUser.value?.role === 'manager')
const completedCount = computed(() => items.value.filter(item => item.completed).length)
const progressLabel = computed(() => `${completedCount.value}/${items.value.length}`)
const progressPercent = computed(() => {
  if (!items.value.length) return 0
  return Math.round((completedCount.value / items.value.length) * 100)
})

function setPending(id: number, pending: boolean) {
  const next = new Set(pendingIds.value)
  if (pending) next.add(id)
  else next.delete(id)
  pendingIds.value = next
}

function isPending(id: number) {
  return pendingIds.value.has(id)
}

function isEditing(item: ChecklistAPI) {
  return editingItemId.value === item.id
}

async function loadChecklist() {
  if (!props.maintenanceId) return

  const requestId = ++loadRequestId
  loading.value = true

  try {
    const loaded = await checklistService.listarPorManutencao(props.maintenanceId)
    if (requestId !== loadRequestId) return
    items.value = loaded
  } catch (error) {
    if (requestId === loadRequestId) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel carregar o checklist.'))
    }
  } finally {
    if (requestId === loadRequestId) loading.value = false
  }
}

async function toggleItem(item: ChecklistAPI, checked: boolean) {
  if (!props.canToggle || props.disabled || isPending(item.id)) return

  const previous = item.completed
  item.completed = checked
  setPending(item.id, true)

  try {
    await checklistService.atualizar(item.id, {
      maintenanceId: item.maintenanceId,
      description: item.description,
      completed: checked,
    })
  } catch (error) {
    item.completed = previous
    toast.error(getApiErrorMessage(error, 'Nao foi possivel atualizar o checklist.'))
  } finally {
    setPending(item.id, false)
  }
}

async function createItem() {
  const description = newDescription.value.trim()
  if (!canManageItems.value || props.disabled || creating.value || !description) return

  creating.value = true

  try {
    await checklistService.criar({
      maintenanceId: props.maintenanceId,
      description,
      completed: false,
    })
    newDescription.value = ''
    adding.value = false
    await loadChecklist()
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Nao foi possivel adicionar o item.'))
  } finally {
    creating.value = false
  }
}

async function updateItemDescription(item: ChecklistAPI) {
  if (!canManageItems.value || props.disabled || !isEditing(item) || isPending(item.id)) return

  const description = editingDescription.value.trim()
  if (!description) {
    toast.error('Informe uma descricao para o item.')
    await focusEditInput(item.id)
    return
  }

  if (description === item.description) {
    cancelEditItem()
    return
  }

  const previous = item.description
  item.description = description
  setPending(item.id, true)

  try {
    await checklistService.atualizar(item.id, {
      maintenanceId: item.maintenanceId,
      description,
      completed: item.completed,
    })
    cancelEditItem()
  } catch (error) {
    item.description = previous
    toast.error(getApiErrorMessage(error, 'Nao foi possivel editar o item.'))
  } finally {
    setPending(item.id, false)
  }
}

async function removeItem(item: ChecklistAPI) {
  if (!canManageItems.value || props.disabled || isPending(item.id)) return

  setPending(item.id, true)

  try {
    await checklistService.remover(item.id)
    items.value = items.value.filter(current => current.id !== item.id)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Nao foi possivel remover o item.'))
  } finally {
    setPending(item.id, false)
  }
}

function startEditItem(item: ChecklistAPI) {
  if (!canManageItems.value || props.disabled || isPending(item.id)) return

  editingItemId.value = item.id
  editingDescription.value = item.description
  void focusEditInput(item.id)
}

function cancelEditItem() {
  editingItemId.value = null
  editingDescription.value = ''
}

async function focusEditInput(itemId: number) {
  await nextTick()
  const input = document.querySelector<HTMLInputElement>(`[data-checklist-edit-id="${itemId}"]`)
  input?.focus()
  input?.select()
}

function cancelCreate() {
  if (creating.value) return
  adding.value = false
  newDescription.value = ''
}

watch(() => props.maintenanceId, () => {
  items.value = []
  adding.value = false
  cancelEditItem()
  newDescription.value = ''
  pendingIds.value = new Set()
  void loadChecklist()
}, { immediate: true })
</script>

<template>
  <section class="mi-checklist">
    <header class="mi-checklist-header">
      <div class="mi-checklist-title">
        <CheckSquare :size="14" />
        <h3>Checklist</h3>
        <span class="mi-checklist-count">{{ progressLabel }}</span>
      </div>
      <Loader2 v-if="loading" :size="15" class="mi-spin" />
    </header>

    <div class="mi-progress" aria-hidden="true">
      <span :style="{ width: `${progressPercent}%` }" />
    </div>

    <div class="mi-checklist-scroll">
      <div v-if="!loading && !items.length" class="mi-checklist-empty">
        Nenhum item cadastrado.
      </div>

      <div v-for="item in items" :key="item.id" class="mi-checklist-item">
        <Checkbox
          :checked="item.completed"
          :disabled="disabled || !canToggle || isPending(item.id)"
          class="mi-check"
          @update:checked="toggleItem(item, $event === true)"
        />
        <input
          v-if="isEditing(item)"
          v-model="editingDescription"
          class="mi-checklist-edit-input"
          maxlength="255"
          :data-checklist-edit-id="item.id"
          :disabled="disabled || isPending(item.id)"
          @blur="updateItemDescription(item)"
          @keydown.enter.prevent="updateItemDescription(item)"
          @keydown.esc.prevent="cancelEditItem"
        />
        <span
          v-else
          class="mi-checklist-text"
          :class="{ 'mi-checklist-text--done': item.completed }"
          @dblclick="startEditItem(item)"
        >
          {{ item.description }}
        </span>
        <div v-if="canManageItems" class="mi-checklist-actions">
          <button
            type="button"
            class="mi-checklist-icon-button"
            title="Editar item"
            :disabled="disabled || isPending(item.id)"
            @click="startEditItem(item)"
          >
            <Pencil :size="13" />
          </button>
          <button
            type="button"
            class="mi-checklist-icon-button"
            title="Remover item"
            :disabled="disabled || isPending(item.id)"
            @click="removeItem(item)"
          >
            <Loader2 v-if="isPending(item.id)" :size="13" class="mi-spin" />
            <Trash2 v-else :size="13" />
          </button>
        </div>
      </div>
    </div>

    <form v-if="canManageItems && adding" class="mi-checklist-form" @submit.prevent="createItem">
      <input
        v-model="newDescription"
        class="mi-checklist-input"
        maxlength="255"
        placeholder="Adicionar um item..."
        :disabled="creating || disabled"
        autofocus
      />
      <div class="mi-checklist-form-actions">
        <button type="submit" class="mi-checklist-add-confirm" :disabled="creating || disabled || !newDescription.trim()">
          {{ creating ? 'Adicionando...' : 'Adicionar' }}
        </button>
        <button type="button" class="mi-checklist-add-cancel" :disabled="creating" @click="cancelCreate">
          <X :size="15" />
        </button>
      </div>
    </form>

    <button
      v-else-if="canManageItems"
      type="button"
      class="mi-checklist-add"
      :disabled="disabled"
      @click="adding = true"
    >
      <Plus :size="15" />
      Adicionar um item
    </button>
  </section>
</template>

<style scoped>
.mi-checklist {
  display: grid;
  flex: 0 0 auto;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.mi-checklist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.mi-checklist-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--nd-text-secondary);
}

.mi-checklist-title h3,
.mi-checklist-count {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mi-checklist-count {
  color: var(--nd-text-primary);
}

.mi-progress {
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--nd-border-visible);
}

.mi-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--nd-success);
  transition: width 180ms ease-out;
}

.mi-checklist-scroll {
  display: grid;
  align-content: start;
  gap: 8px;
}

.mi-checklist-empty {
  color: var(--nd-text-secondary);
  font-size: 0.82rem;
}

.mi-checklist-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 32px;
}

.mi-check {
  border-color: var(--nd-border-visible);
}

.mi-check[data-state='checked'] {
  border-color: var(--nd-success);
  background: var(--nd-success);
  color: #0b0f14;
}

.mi-checklist-text {
  min-width: 0;
  color: var(--nd-text-primary);
  font-size: 0.86rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.mi-checklist-text--done {
  color: var(--nd-text-secondary);
  text-decoration: line-through;
}

.mi-checklist-icon-button,
.mi-checklist-add-cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  color: var(--nd-text-secondary);
  background: transparent;
  cursor: pointer;
}

.mi-checklist-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 150ms ease-out, color 150ms ease-out, background 150ms ease-out;
}

.mi-checklist-item:hover .mi-checklist-actions,
.mi-checklist-actions:focus-within {
  opacity: 1;
}

.mi-checklist-icon-button:hover,
.mi-checklist-add-cancel:hover {
  color: var(--nd-accent);
  background: var(--nd-surface-raised);
}

.mi-checklist-icon-button:disabled,
.mi-checklist-add:disabled,
.mi-checklist-add-confirm:disabled,
.mi-checklist-add-cancel:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.mi-checklist-edit-input {
  width: 100%;
  min-height: 30px;
  border: 1px solid var(--nd-action);
  border-radius: 6px;
  padding: 0 9px;
  color: var(--nd-text-primary);
  background: var(--nd-bg);
  font-size: 0.86rem;
  line-height: 1.35;
  outline: none;
}

.mi-checklist-edit-input:focus {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--nd-action) 20%, transparent);
}

.mi-checklist-add {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 8px;
  min-height: 30px;
  border: 0;
  padding: 0;
  color: var(--nd-text-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 0.86rem;
}

.mi-checklist-add:hover {
  color: var(--nd-action);
}

.mi-checklist-form {
  display: grid;
  gap: 10px;
}

.mi-checklist-input {
  width: 100%;
  min-height: 36px;
  border: 1px solid var(--nd-success);
  border-radius: 10px;
  padding: 0 12px;
  color: var(--nd-text-primary);
  background: var(--nd-bg);
  outline: none;
}

.mi-checklist-input:focus {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--nd-success) 22%, transparent);
}

.mi-checklist-form-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mi-checklist-add-confirm {
  min-height: 32px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  color: #0b0f14;
  background: var(--nd-success);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
}

.mi-spin {
  animation: mi-spin 0.8s linear infinite;
}

@keyframes mi-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .mi-checklist {
    padding: 16px;
  }
}
</style>
