<script setup lang="ts">
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  destructive?: boolean
}>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  loading: false,
  destructive: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="cad-title">{{ title }}</DialogTitle>
        <DialogDescription class="cad-description">
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose as-child>
          <button type="button" class="cad-button cad-button--secondary" :disabled="loading">
            {{ cancelLabel }}
          </button>
        </DialogClose>
        <button
          type="button"
          class="cad-button cad-button--primary"
          :class="{ 'cad-button--destructive': destructive }"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.cad-title {
  color: var(--nd-text-primary);
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 800;
}

.cad-description {
  color: var(--nd-text-secondary);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.86rem;
  line-height: 1.5;
}

.cad-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
}

.cad-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.cad-button--secondary {
  color: var(--nd-text-secondary);
  background: transparent;
}

.cad-button--secondary:hover {
  color: var(--nd-text-primary);
}

.cad-button--primary {
  color: var(--nd-action-foreground);
  background: var(--nd-action);
}

.cad-button--primary:hover {
  background: var(--nd-action-hover);
}

.cad-button--destructive {
  color: #fff;
  background: var(--nd-accent);
}
</style>
