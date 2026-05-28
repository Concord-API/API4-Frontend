<script setup lang="ts">
import { Loader2, Send } from 'lucide-vue-next'
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
    <textarea
      :value="modelValue"
      class="mi-composer-input"
      rows="2"
      placeholder="Adicionar um comentario..."
      :disabled="sending"
      :maxlength="maxLength"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @keydown.enter.exact.prevent="emit('send')"
    />

    <div class="mi-composer-actions">
      <span>{{ modelValue.length }}/{{ maxLength }}</span>
      <Button type="submit" size="icon" class="mi-send-button" :disabled="sending || !modelValue.trim()">
        <Loader2 v-if="sending" :size="16" class="mi-spin" />
        <Send v-else :size="16" />
      </Button>
    </div>
  </form>
</template>

<style scoped>
.mi-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.mi-composer-input {
  width: 100%;
  min-height: 48px;
  max-height: 120px;
  resize: vertical;
  border: 1px solid var(--nd-border);
  border-radius: 4px;
  padding: 12px;
  color: var(--nd-text-primary);
  background: var(--nd-surface-raised);
  font-size: 0.88rem;
  line-height: 1.4;
  outline: none;
}

.mi-composer-input:focus {
  border-color: var(--nd-action);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--nd-action) 14%, transparent);
}

.mi-composer-actions {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  color: var(--nd-text-secondary);
  font-size: 0.72rem;
}

.mi-send-button {
  width: 42px;
  height: 42px;
  border-radius: 4px;
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
  .mi-composer {
    grid-template-columns: 1fr;
  }

  .mi-composer-actions {
    justify-content: space-between;
  }
}
</style>
