<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { CheckSquare, CornerDownLeft, Loader2, Pencil, Plus, Trash2 } from 'lucide-vue-next'
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

function normalizeCompleted(value: unknown) {
  return value === true || value === 1 || String(value).toLowerCase() === 'true'
}

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
    items.value = loaded.map(item => ({
      ...item,
      completed: normalizeCompleted(item.completed),
    }))
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
      completed: checked,
    })
    await loadChecklist()
    toast.success(checked ? 'Item marcado como concluido.' : 'Item marcado como pendente.')
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

watch(() => props.maintenanceId, () => {
  items.value = []
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
      <div v-if="!loading && !items.length && !canManageItems" class="mi-checklist-empty">
        Nenhum item cadastrado.
      </div>

      <div v-for="item in items" :key="item.id" class="mi-checklist-item">
        <Checkbox
          :model-value="item.completed"
          :disabled="disabled || !canToggle || isPending(item.id)"
          class="mi-check"
          @update:model-value="toggleItem(item, $event === true)"
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

      <div v-if="canManageItems" class="mi-checklist-add">
        <span class="mi-checklist-add-box" aria-hidden="true">
          <Loader2 v-if="creating" :size="12" class="mi-spin" />
          <Plus v-else :size="12" />
        </span>
        <input
          v-model="newDescription"
          class="mi-checklist-add-input"
          maxlength="255"
          placeholder="Adicionar um item..."
          :disabled="creating || disabled"
          @keydown.enter.prevent="createItem"
        />
        <button
          type="button"
          class="mi-checklist-add-enter"
          title="Adicionar item"
          aria-label="Adicionar item"
          :disabled="creating || disabled || !newDescription.trim()"
          @click="createItem"
        >
          <CornerDownLeft :size="13" />
        </button>
      </div>
    </div>
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

.mi-checklist-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 8px;
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
.mi-checklist-add:hover .mi-checklist-add-box {
  color: var(--nd-accent);
  background: var(--nd-surface-raised);
}

.mi-checklist-icon-button:disabled,
.mi-checklist-add-input:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.mi-checklist-edit-input {
  width: 100%;
  min-height: 30px;
  border: 1px solid var(--nd-action);
  border-radius: 8px;
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
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  cursor: text;
}

.mi-checklist-add-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--nd-border-visible);
  border-radius: 4px;
  color: var(--nd-text-disabled);
  background: transparent;
}

.mi-checklist-add:focus-within .mi-checklist-add-box {
  border-color: var(--nd-action);
  color: var(--nd-action);
}

.mi-checklist-add-input {
  width: 100%;
  min-width: 0;
  border: 0;
  border-bottom: 1px solid transparent;
  padding: 0;
  color: var(--nd-text-primary);
  background: transparent;
  outline: none;
  font-size: 0.86rem;
  line-height: 1.35;
}

.mi-checklist-add-input::placeholder {
  color: var(--nd-text-disabled);
}

.mi-checklist-add-input:focus {
  border-bottom-color: var(--nd-border-visible);
}

.mi-checklist-add-enter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 6px;
  color: var(--nd-text-disabled);
  background: transparent;
  cursor: pointer;
  opacity: 0;
  transition: opacity 150ms ease-out, color 150ms ease-out, background-color 150ms ease-out;
}

.mi-checklist-add:focus-within .mi-checklist-add-enter,
.mi-checklist-add:hover .mi-checklist-add-enter {
  opacity: 1;
}

.mi-checklist-add-enter:hover {
  color: var(--nd-action);
  background: var(--nd-surface-raised);
}

.mi-checklist-add-enter:disabled {
  cursor: default;
  opacity: 0;
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
