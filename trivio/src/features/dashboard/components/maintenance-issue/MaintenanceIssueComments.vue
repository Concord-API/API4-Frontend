<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuth } from '@/shared/composables/useAuth'
import { getApiErrorMessage } from '@/shared/services/api'
import { followService, type FollowAPI } from '@/shared/services/followService'
import MaintenanceIssueComposer from './MaintenanceIssueComposer.vue'

const props = defineProps<{
  maintenanceId: number
  disabled?: boolean
}>()

const { currentUser } = useAuth()

const follows = ref<FollowAPI[]>([])
const loading = ref(false)
const sending = ref(false)
const message = ref('')
const editingId = ref<number | null>(null)
const editingMessage = ref('')
const pendingIds = ref(new Set<number>())
const threadRef = ref<HTMLElement | null>(null)
const maxMessageLength = 1000
let loadRequestId = 0

const currentUserId = computed(() => Number(currentUser.value?.id))

function isOwn(follow: FollowAPI) {
  return Number(follow.employeeId) === currentUserId.value
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function isEdited(follow: FollowAPI) {
  return Boolean(follow.updatedAt && follow.updatedAt !== follow.createdAt)
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

function scrollToBottom() {
  nextTick(() => {
    if (!threadRef.value) return
    threadRef.value.scrollTop = threadRef.value.scrollHeight
  })
}

async function loadFollows() {
  if (!props.maintenanceId) return

  const requestId = ++loadRequestId
  loading.value = true

  try {
    const loaded = await followService.listarPorManutencao(props.maintenanceId)
    if (requestId !== loadRequestId) return
    follows.value = loaded
    scrollToBottom()
  } catch (error) {
    if (requestId === loadRequestId) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel carregar o acompanhamento.'))
    }
  } finally {
    if (requestId === loadRequestId) loading.value = false
  }
}

async function sendMessage() {
  const trimmed = message.value.trim()
  if (!trimmed || sending.value || props.disabled) return

  sending.value = true

  try {
    await followService.criar({ maintenanceId: props.maintenanceId, message: trimmed })
    message.value = ''
    await loadFollows()
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Nao foi possivel enviar a mensagem.'))
  } finally {
    sending.value = false
  }
}

function startEdit(follow: FollowAPI) {
  if (!isOwn(follow)) return
  editingId.value = follow.id
  editingMessage.value = follow.message
}

function cancelEdit() {
  editingId.value = null
  editingMessage.value = ''
}

async function saveEdit(follow: FollowAPI) {
  const trimmed = editingMessage.value.trim()
  if (!trimmed || isPending(follow.id)) return

  setPending(follow.id, true)

  try {
    await followService.atualizar({ id: follow.id, message: trimmed, active: true })
    follows.value = follows.value.map(item =>
      item.id === follow.id ? { ...item, message: trimmed, updatedAt: new Date().toISOString() } : item,
    )
    cancelEdit()
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Nao foi possivel editar a mensagem.'))
  } finally {
    setPending(follow.id, false)
  }
}

async function removeFollow(follow: FollowAPI) {
  if (!isOwn(follow) || isPending(follow.id)) return

  setPending(follow.id, true)

  try {
    await followService.atualizar({ id: follow.id, message: follow.message, active: false })
    follows.value = follows.value.filter(item => item.id !== follow.id)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Nao foi possivel remover a mensagem.'))
  } finally {
    setPending(follow.id, false)
  }
}

watch(() => props.maintenanceId, loadFollows, { immediate: true })
</script>

<template>
  <section class="mi-comments">
    <header class="mi-comments-header">
      <div class="mi-comments-title">
        <h3>Acompanhamento</h3>
        <span class="mi-comments-count">{{ follows.length }}</span>
      </div>
      <button type="button" class="mi-comments-sort">Mais recentes</button>
    </header>

    <div ref="threadRef" class="mi-thread">
      <div v-if="loading" class="mi-state">
        <Loader2 :size="18" class="mi-spin" />
        <span>Carregando acompanhamento...</span>
      </div>

      <div v-else-if="!follows.length" class="mi-state">
        Nenhuma mensagem registrada.
      </div>

      <template v-else>
        <article
          v-for="follow in follows"
          :key="follow.id"
          class="mi-comment-row"
          :class="{ 'mi-comment-row--own': isOwn(follow) }"
        >
          <div class="mi-comment-avatar">
            {{ initials(follow.employeeName) }}
          </div>

          <div class="mi-comment-body">
            <div class="mi-comment-meta">
              <strong>{{ follow.employeeName }}</strong>
              <span>{{ formatTime(follow.createdAt) }}</span>
              <span v-if="isOwn(follow)" class="mi-own-label">voce</span>
              <span v-if="isEdited(follow)" class="mi-edited-label">editada</span>
            </div>

            <div class="mi-comment-bubble" :class="{ 'mi-comment-bubble--own': isOwn(follow) }">
              <template v-if="editingId === follow.id">
                <textarea
                  v-model="editingMessage"
                  class="mi-edit-input"
                  rows="2"
                  :maxlength="maxMessageLength"
                  :disabled="isPending(follow.id)"
                  @keydown.enter.exact.prevent="saveEdit(follow)"
                  @keydown.esc.prevent="cancelEdit"
                />
                <div class="mi-edit-actions">
                  <button type="button" class="mi-mini-button" :disabled="isPending(follow.id) || !editingMessage.trim()" @click="saveEdit(follow)">
                    <Loader2 v-if="isPending(follow.id)" :size="14" class="mi-spin" />
                    <Check v-else :size="14" />
                  </button>
                  <button type="button" class="mi-mini-button" :disabled="isPending(follow.id)" @click="cancelEdit">
                    <X :size="14" />
                  </button>
                </div>
              </template>

              <p v-else>{{ follow.message }}</p>

              <div v-if="isOwn(follow) && editingId !== follow.id" class="mi-comment-actions">
                <button type="button" class="mi-mini-button" :disabled="isPending(follow.id)" title="Editar" @click="startEdit(follow)">
                  <Pencil :size="13" />
                </button>
                <button type="button" class="mi-mini-button" :disabled="isPending(follow.id)" title="Remover" @click="removeFollow(follow)">
                  <Loader2 v-if="isPending(follow.id)" :size="13" class="mi-spin" />
                  <Trash2 v-else :size="13" />
                </button>
              </div>
            </div>
          </div>
        </article>
      </template>
    </div>

    <MaintenanceIssueComposer
      v-model="message"
      :sending="sending"
      :disabled="disabled"
      :max-length="maxMessageLength"
      @send="sendMessage"
    />
  </section>
</template>

<style scoped>
.mi-comments {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  background: var(--nd-surface);
}

.mi-comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 0 24px;
  border-bottom: 1px solid var(--nd-border);
}

.mi-comments-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mi-comments-header h3 {
  margin: 0;
  color: var(--nd-text-primary);
  font-size: 0.86rem;
  font-weight: 800;
}

.mi-comments-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  color: var(--nd-text-secondary);
  background: var(--nd-border-visible);
  font-size: 0.68rem;
  font-weight: 800;
}

.mi-comments-sort {
  border: 0;
  color: var(--nd-interactive);
  background: transparent;
  font-size: 0.72rem;
  cursor: pointer;
}

.mi-thread {
  display: flex;
  min-height: 0;
  padding: 16px 20px 20px;
  gap: 16px;
  overflow-y: auto;
  flex-direction: column;
}

.mi-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  color: var(--nd-text-secondary);
  font-size: 0.88rem;
}

.mi-comment-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.mi-comment-row--own {
  justify-content: flex-start;
  flex-direction: row-reverse;
}

.mi-comment-row--own .mi-comment-body {
  justify-items: end;
}

.mi-comment-row--own .mi-comment-meta {
  justify-content: flex-end;
}

.mi-comment-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: white;
  background: var(--nd-interactive);
  font-size: 0.78rem;
  font-weight: 800;
  flex: 0 0 auto;
}

.mi-comment-body {
  display: grid;
  min-width: 0;
  width: min(100%, 516px);
  gap: 6px;
}

.mi-comment-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: var(--nd-text-secondary);
  font-size: 0.7rem;
}

.mi-comment-meta strong {
  color: var(--nd-text-primary);
}

.mi-own-label {
  color: var(--nd-action);
  font-weight: 800;
}

.mi-edited-label {
  font-style: italic;
}

.mi-comment-bubble {
  position: relative;
  width: fit-content;
  max-width: min(100%, 620px);
  padding: 11px 14px;
  border: 1px solid var(--nd-border);
  border-radius: 10px;
  color: var(--nd-text-primary);
  background: var(--nd-surface-raised);
}

.mi-comment-bubble--own {
  border-color: var(--nd-success);
  background: color-mix(in srgb, var(--nd-success) 16%, var(--nd-surface));
}

.mi-comment-bubble p {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.45;
}

.mi-comment-actions {
  display: flex;
  position: absolute;
  top: -14px;
  right: 8px;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.mi-comment-bubble:hover .mi-comment-actions,
.mi-comment-bubble:focus-within .mi-comment-actions {
  opacity: 1;
}

.mi-mini-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--nd-border);
  border-radius: 4px;
  color: var(--nd-text-secondary);
  background: var(--nd-surface);
  cursor: pointer;
}

.mi-mini-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.mi-edit-input {
  width: min(560px, 70vw);
  min-height: 74px;
  resize: vertical;
  border: 1px solid var(--nd-border);
  border-radius: 4px;
  padding: 8px;
  color: var(--nd-text-primary);
  background: var(--nd-surface);
  outline: none;
}

.mi-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
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
  .mi-comments-header,
  .mi-thread {
    padding-right: 16px;
    padding-left: 16px;
  }

  .mi-comment-avatar {
    width: 32px;
    height: 32px;
  }
}
</style>
