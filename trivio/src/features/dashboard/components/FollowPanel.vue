<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Check, Loader2, Pencil, Send, Trash2, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuth } from '@/shared/composables/useAuth'
import { getApiErrorMessage } from '@/shared/services/api'
import { followService, type FollowAPI } from '@/shared/services/followService'
import { Button } from '@/shared/components/ui/button'

const props = defineProps<{
  maintenanceId: number
}>()

const { currentUser } = useAuth()

const follows = ref<FollowAPI[]>([])
const loading = ref(false)
const sending = ref(false)
const message = ref('')
const editingId = ref<number | null>(null)
const editingMessage = ref('')
const chatScroll = ref<HTMLElement | null>(null)
const pendingIds = ref(new Set<number>())
const maxMessageLength = 1000
let loadRequestId = 0

const currentUserId = computed(() => Number(currentUser.value?.id))

function isOwnMessage(follow: FollowAPI) {
  return Number(follow.employeeId) === currentUserId.value
}

function isEdited(follow: FollowAPI) {
  return Boolean(follow.updatedAt && follow.updatedAt !== follow.createdAt)
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

function scrollToBottom() {
  nextTick(() => {
    if (!chatScroll.value) return
    chatScroll.value.scrollTop = chatScroll.value.scrollHeight
  })
}

function setPending(id: number, pending: boolean) {
  const nextPendingIds = new Set(pendingIds.value)
  if (pending) nextPendingIds.add(id)
  else nextPendingIds.delete(id)
  pendingIds.value = nextPendingIds
}

function isPending(id: number) {
  return pendingIds.value.has(id)
}

async function loadFollows() {
  if (!props.maintenanceId) return

  const requestId = ++loadRequestId
  loading.value = true

  try {
    const loadedFollows = await followService.listarPorManutencao(props.maintenanceId)
    if (requestId !== loadRequestId) return

    follows.value = loadedFollows
    scrollToBottom()
  } catch (error) {
    if (requestId === loadRequestId) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel carregar o acompanhamento.'))
    }
  } finally {
    if (requestId === loadRequestId) {
      loading.value = false
    }
  }
}

async function sendMessage() {
  const trimmed = message.value.trim()
  if (!trimmed || sending.value) return

  sending.value = true

  try {
    await followService.criar({
      maintenanceId: props.maintenanceId,
      message: trimmed,
    })

    message.value = ''
    await loadFollows()
    scrollToBottom()
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Nao foi possivel enviar a mensagem.'))
  } finally {
    sending.value = false
  }
}

function startEdit(follow: FollowAPI) {
  if (!isOwnMessage(follow)) return

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
    await followService.atualizar({
      id: follow.id,
      message: trimmed,
      active: true,
    })

    follows.value = follows.value.map(item =>
      item.id === follow.id
        ? { ...item, message: trimmed, updatedAt: new Date().toISOString() }
        : item,
    )
    cancelEdit()
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Nao foi possivel editar a mensagem.'))
  } finally {
    setPending(follow.id, false)
  }
}

async function removeFollow(follow: FollowAPI) {
  if (!isOwnMessage(follow) || isPending(follow.id)) return

  setPending(follow.id, true)
  try {
    await followService.atualizar({
      id: follow.id,
      message: follow.message,
      active: false,
    })

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
  <section class="fp-panel" aria-label="Acompanhamento da manutencao">
    <header class="fp-header">
      <div>
        <h3 class="fp-title">Acompanhamento</h3>
        <p class="fp-subtitle">Historico de comentarios do chamado</p>
      </div>
      <span class="fp-count">{{ follows.length }}</span>
    </header>

    <div ref="chatScroll" class="fp-chat">
      <div v-if="loading" class="fp-state">
        <Loader2 :size="18" class="fp-loader" />
        <span>Carregando acompanhamento...</span>
      </div>

      <div v-else-if="!follows.length" class="fp-state">
        <span>Nenhuma mensagem registrada.</span>
      </div>

      <div
        v-for="follow in follows"
        v-else
        :key="follow.id"
        class="fp-message-row"
        :class="{ 'fp-message-row--own': isOwnMessage(follow) }"
      >
        <div v-if="!isOwnMessage(follow)" class="fp-avatar">
          {{ initials(follow.employeeName) }}
        </div>

        <article class="fp-message" :class="{ 'fp-message--own': isOwnMessage(follow) }">
          <div class="fp-message-meta">
            <span class="fp-author">{{ follow.employeeName }}</span>
            <span class="fp-time">{{ formatTime(follow.createdAt) }}</span>
            <span v-if="isEdited(follow)" class="fp-edited">editada</span>
          </div>

          <div v-if="editingId === follow.id" class="fp-edit-box">
            <textarea
              v-model="editingMessage"
              class="fp-edit-input"
              rows="2"
              :maxlength="maxMessageLength"
              :disabled="isPending(follow.id)"
              @keydown.enter.exact.prevent="saveEdit(follow)"
              @keydown.esc.prevent="cancelEdit"
            />
            <div class="fp-edit-actions">
              <span class="fp-limit">{{ editingMessage.length }}/{{ maxMessageLength }}</span>
              <button
                type="button"
                class="fp-action-btn"
                title="Salvar"
                :disabled="isPending(follow.id) || !editingMessage.trim()"
                @click="saveEdit(follow)"
              >
                <Loader2 v-if="isPending(follow.id)" :size="14" class="fp-loader" />
                <Check v-else :size="14" />
              </button>
              <button
                type="button"
                class="fp-action-btn"
                title="Cancelar"
                :disabled="isPending(follow.id)"
                @click="cancelEdit"
              >
                <X :size="14" />
              </button>
            </div>
          </div>

          <p v-else class="fp-text">{{ follow.message }}</p>

          <div v-if="isOwnMessage(follow) && editingId !== follow.id" class="fp-message-actions">
            <button
              type="button"
              class="fp-action-btn"
              title="Editar"
              :disabled="isPending(follow.id)"
              @click="startEdit(follow)"
            >
              <Pencil :size="13" />
            </button>
            <button
              type="button"
              class="fp-action-btn"
              title="Remover"
              :disabled="isPending(follow.id)"
              @click="removeFollow(follow)"
            >
              <Loader2 v-if="isPending(follow.id)" :size="13" class="fp-loader" />
              <Trash2 v-else :size="13" />
            </button>
          </div>
        </article>
      </div>
    </div>

    <form class="fp-composer" @submit.prevent="sendMessage">
      <textarea
        v-model="message"
        class="fp-composer-input"
        rows="2"
        placeholder="Escreva uma mensagem..."
        :disabled="sending"
        :maxlength="maxMessageLength"
        @keydown.enter.exact.prevent="sendMessage"
      />
      <div class="fp-composer-side">
        <span class="fp-limit">{{ message.length }}/{{ maxMessageLength }}</span>
        <Button type="submit" size="icon" class="fp-send-button" :disabled="sending || !message.trim()">
          <Loader2 v-if="sending" :size="16" class="fp-loader" />
          <Send v-else :size="16" />
        </Button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.fp-panel {
  display: flex;
  min-height: 360px;
  border: 1px solid var(--nd-border);
  border-radius: 6px;
  background: var(--nd-surface);
  overflow: hidden;
  flex-direction: column;
}

.fp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--nd-border);
  background: var(--nd-surface-raised);
}

.fp-title {
  margin: 0;
  color: var(--nd-text-primary);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
}

.fp-subtitle {
  margin: 4px 0 0;
  color: var(--nd-text-secondary);
  font-size: 0.75rem;
}

.fp-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--nd-border);
  border-radius: 999px;
  color: var(--nd-text-secondary);
  background: var(--nd-surface);
  font-size: 0.75rem;
  font-weight: 700;
}

.fp-chat {
  display: flex;
  flex: 1;
  min-height: 220px;
  max-height: 320px;
  padding: 16px;
  gap: 12px;
  overflow-y: auto;
  background: color-mix(in srgb, var(--nd-surface-raised) 64%, transparent);
  flex-direction: column;
}

.fp-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 180px;
  gap: 8px;
  color: var(--nd-text-secondary);
  font-size: 0.84rem;
}

.fp-loader {
  animation: fp-spin 0.8s linear infinite;
}

.fp-message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.fp-message-row--own {
  justify-content: flex-end;
}

.fp-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--nd-text-inverse, #ffffff);
  background: var(--nd-action);
  font-size: 0.7rem;
  font-weight: 800;
  flex: 0 0 auto;
}

.fp-message {
  position: relative;
  width: fit-content;
  max-width: min(72%, 520px);
  padding: 8px 10px;
  border: 1px solid var(--nd-border);
  border-radius: 6px;
  color: var(--nd-text-primary);
  background: var(--nd-surface);
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
}

.fp-message--own {
  border-color: color-mix(in srgb, var(--nd-action) 36%, var(--nd-border));
  color: var(--nd-text-primary);
  background: color-mix(in srgb, var(--nd-action) 12%, var(--nd-surface));
}

.fp-message-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  color: var(--nd-text-secondary);
  font-size: 0.68rem;
  line-height: 1;
}

.fp-author {
  color: var(--nd-text-primary);
  font-weight: 700;
}

.fp-edited {
  color: var(--nd-text-secondary);
  font-style: italic;
}

.fp-text {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 0.86rem;
  line-height: 1.45;
}

.fp-message-actions {
  display: flex;
  position: absolute;
  top: -12px;
  right: 8px;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.fp-message:hover .fp-message-actions,
.fp-message:focus-within .fp-message-actions {
  opacity: 1;
}

.fp-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--nd-border);
  border-radius: 6px;
  color: var(--nd-text-secondary);
  background: var(--nd-surface);
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.fp-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.fp-action-btn:hover {
  border-color: var(--nd-action);
  color: var(--nd-action);
  background: var(--nd-surface-raised);
}

.fp-edit-box {
  display: grid;
  gap: 8px;
}

.fp-edit-input,
.fp-composer-input {
  width: 100%;
  resize: none;
  border: 1px solid var(--nd-border);
  border-radius: 6px;
  color: var(--nd-text-primary);
  background: var(--nd-surface);
  font-size: 0.86rem;
  line-height: 1.4;
  outline: none;
}

.fp-edit-input {
  min-width: 240px;
  padding: 8px;
}

.fp-edit-input:focus,
.fp-composer-input:focus {
  border-color: var(--nd-action);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--nd-action) 16%, transparent);
}

.fp-edit-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.fp-composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.fp-composer-input {
  min-height: 42px;
  max-height: 96px;
  padding: 9px 10px;
}

.fp-composer-input::placeholder {
  color: var(--nd-text-tertiary, var(--nd-text-secondary));
}

.fp-composer-side {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.fp-limit {
  color: var(--nd-text-secondary);
  font-size: 0.68rem;
  line-height: 24px;
  white-space: nowrap;
}

.fp-send-button {
  align-self: end;
  width: 40px;
  height: 40px;
  border-radius: 6px;
}

@keyframes fp-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .fp-chat {
    max-height: 45vh;
    padding: 12px;
  }

  .fp-message {
    max-width: 84%;
  }

  .fp-composer {
    grid-template-columns: 1fr;
  }

  .fp-composer-side {
    justify-content: space-between;
  }
}
</style>
