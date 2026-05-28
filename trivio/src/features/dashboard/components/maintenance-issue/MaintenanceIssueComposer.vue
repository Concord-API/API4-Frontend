<script setup lang="ts">
import { Loader2, Paperclip, Send, Smile } from 'lucide-vue-next'
import { Button } from '@/shared/components/ui/button'

defineProps<{
  modelValue: string
  sending?: boolean
  maxLength: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: []
}>()
</script>

<template>
  <form class="mi-composer" @submit.prevent="emit('send')">
    <div class="mi-composer-box">
      <textarea
        :value="modelValue"
        class="mi-composer-input"
        rows="1"
        placeholder="Adicionar um comentário..."
        :disabled="sending"
        :maxlength="maxLength"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @keydown.enter.exact.prevent="emit('send')"
      />

      <div class="mi-composer-actions">
        <button type="button" class="mi-composer-icon" title="Anexar">
          <Paperclip :size="16" />
        </button>
        <button type="button" class="mi-composer-icon" title="Emoji">
          <Smile :size="16" />
        </button>
        <Button type="submit" size="icon" class="mi-send-button" :disabled="sending || !modelValue.trim()">
          <Loader2 v-if="sending" :size="16" class="mi-spin" />
          <Send v-else :size="17" />
        </Button>
      </div>
    </div>

    <div class="mi-composer-footer">
      <span>Enter para enviar · Shift+Enter para nova linha</span>
      <span>{{ modelValue.length }}/{{ maxLength }}</span>
    </div>
  </form>
</template>

<style scoped>
.mi-composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 12px 10px;
  border-top: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.mi-composer-box {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 48px;
  padding: 0 8px 0 12px;
  border: 1px solid var(--nd-border);
  border-radius: 16px;
  background: var(--nd-bg);
}

.mi-composer-input {
  width: 100%;
  height: 24px;
  max-height: 72px;
  resize: none;
  border: 0;
  padding: 2px 0 0;
  color: var(--nd-text-primary);
  background: transparent;
  font-size: 0.82rem;
  line-height: 1.4;
  outline: none;
}

.mi-composer-input:focus {
  box-shadow: none;
}

.mi-composer-input::placeholder {
  color: var(--nd-text-secondary);
}

.mi-composer-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mi-composer-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  color: var(--nd-text-secondary);
  background: transparent;
  cursor: pointer;
}

.mi-composer-icon:hover {
  color: var(--nd-text-primary);
  background: var(--nd-surface-raised);
}

.mi-send-button {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  color: var(--nd-action-foreground);
  background: var(--nd-action);
}

.mi-send-button:hover {
  background: var(--nd-action-hover);
}

.mi-composer-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 4px;
  color: var(--nd-text-secondary);
  font-size: 0.64rem;
}

.mi-spin {
  animation: mi-spin 0.8s linear infinite;
}

@keyframes mi-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .mi-composer-footer {
    flex-direction: column;
    gap: 2px;
  }
}
</style>
