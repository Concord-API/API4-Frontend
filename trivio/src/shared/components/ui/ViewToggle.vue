<script setup lang="ts">
import { List, LayoutGrid } from 'lucide-vue-next'
const model = defineModel<'table' | 'grid'>({ default: 'table' })
</script>

<template>
  <div class="nd-vt">
    <button type="button" :class="['nd-vt-btn', model === 'table' && 'nd-vt-btn--active']" @click="model = 'table'">
      <List :size="14" />
    </button>
    <button type="button" :class="['nd-vt-btn', model === 'grid' && 'nd-vt-btn--active']" @click="model = 'grid'">
      <LayoutGrid :size="14" />
    </button>
  </div>
</template>

<style scoped>
.nd-vt {
  display: flex;
  border: 1px solid var(--nd-border-visible);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.nd-vt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--nd-text-disabled);
  transition: color 150ms ease-out, background 150ms ease-out;
}
.nd-vt-btn:hover { color: var(--nd-text-secondary); }
.nd-vt-btn--active { background: var(--nd-surface-raised); color: var(--nd-text-display); }
.nd-vt-btn:not(:last-child) { border-right: 1px solid var(--nd-border-visible); }
</style>
