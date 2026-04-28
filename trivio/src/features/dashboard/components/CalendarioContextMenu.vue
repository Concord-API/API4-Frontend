<script setup lang="ts">
import {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
} from 'reka-ui'
import { CalendarDays, Plus } from 'lucide-vue-next'

const emit = defineEmits<{
  'nova-manutencao': []
  'ir-para-hoje': []
}>()
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="cal-ctx-content">
        <ContextMenuItem class="cal-ctx-item" @select="emit('nova-manutencao')">
          <Plus :size="12" class="cal-ctx-icon" />
          Nova Manutenção
        </ContextMenuItem>
        <ContextMenuItem class="cal-ctx-item" @select="emit('ir-para-hoje')">
          <CalendarDays :size="12" class="cal-ctx-icon" />
          Ir para Hoje
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

<style>
.cal-ctx-content {
  background: var(--nd-surface-raised, var(--nd-surface));
  border: 1px solid var(--nd-border-visible);
  border-radius: 6px;
  padding: 4px;
  min-width: 180px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  z-index: 100;
  animation: ctx-in 80ms ease-out;
}

.cal-ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  color: var(--nd-text-primary);
  padding: 7px 10px;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  user-select: none;
  transition: background 80ms ease-out;
}
.cal-ctx-item[data-highlighted] {
  background: var(--nd-surface);
  color: var(--nd-text-display);
}

.cal-ctx-icon {
  color: var(--nd-text-disabled);
  flex-shrink: 0;
}

@keyframes ctx-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
</style>
