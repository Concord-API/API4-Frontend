<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import type { ComboboxOption } from './NdCombobox.vue'

const props = withDefaults(defineProps<{
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  singularLabel?: string
  pluralLabel?: string
}>(), {
  placeholder: 'Selecione...',
  searchPlaceholder: 'Buscar...',
  emptyText: 'NENHUM RESULTADO',
  singularLabel: 'selecionado',
  pluralLabel: 'selecionados',
})

const model = defineModel<(string | number)[]>({ default: () => [] })

const open = ref(false)
onBeforeUnmount(() => { open.value = false })

const triggerLabel = computed(() => {
  const count = model.value.length
  if (count === 0) return null
  if (count === 1) {
    return props.options.find(o => o.value === model.value[0])?.label ?? `1 ${props.singularLabel}`
  }
  return `${count} ${props.pluralLabel}`
})

function toggle(opt: ComboboxOption) {
  const idx = model.value.indexOf(opt.value)
  if (idx >= 0) {
    model.value = model.value.filter(v => v !== opt.value)
  } else {
    model.value = [...model.value, opt.value]
  }
}

function isSelected(value: string | number) {
  return model.value.includes(value)
}
</script>

<template>
  <Popover v-model:open="open" :modal="false">
    <PopoverTrigger as-child>
      <button
        type="button"
        role="combobox"
        :aria-expanded="open"
        :disabled="disabled"
        class="nd-cb-trigger"
        :class="{ 'nd-cb-trigger--open': open }"
      >
        <span :class="triggerLabel ? 'nd-cb-value' : 'nd-cb-placeholder'">
          {{ triggerLabel ?? placeholder }}
        </span>
        <ChevronsUpDown :size="12" class="nd-cb-icon" />
      </button>
    </PopoverTrigger>

    <PopoverContent class="nd-cb-content" align="start" :side-offset="2">
      <Command>
        <CommandInput :placeholder="searchPlaceholder" class="nd-cb-input" />
        <CommandList class="nd-cb-list">
          <CommandEmpty class="nd-cb-empty">{{ emptyText }}</CommandEmpty>
          <CommandGroup class="nd-cb-group">
            <CommandItem
              v-for="opt in options"
              :key="String(opt.value)"
              :value="String(opt.value)"
              class="nd-cb-item"
              @select.prevent="toggle(opt)"
            >
              <Check
                :size="11"
                class="nd-cb-check"
                :class="{ 'nd-cb-check--on': isSelected(opt.value) }"
              />
              {{ opt.label }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.nd-cb-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--nd-border-visible);
  padding: 8px 0;
  cursor: pointer;
  transition: border-color 150ms ease-out;
  gap: 8px;
}
.nd-cb-trigger:hover,
.nd-cb-trigger--open { border-bottom-color: var(--nd-text-primary); }
.nd-cb-trigger:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

.nd-cb-value {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  color: var(--nd-text-primary);
  text-align: left;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nd-cb-placeholder {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  color: var(--nd-text-disabled);
  text-align: left;
  flex: 1;
}
.nd-cb-icon { color: var(--nd-text-disabled); flex-shrink: 0; }

:deep(.nd-cb-content) {
  background: var(--nd-surface) !important;
  border: 1px solid var(--nd-border-visible) !important;
  border-radius: 4px !important;
  padding: 0 !important;
  box-shadow: none !important;
  width: var(--reka-popover-trigger-width) !important;
  min-width: 180px !important;
  overflow: hidden !important;
}

:deep([cmdk-input-wrapper]),
:deep([data-slot="command-input-wrapper"]) {
  display: flex !important;
  align-items: center !important;
  gap: 0 !important;
  padding: 0 !important;
  border: none !important;
  border-bottom: 1px solid var(--nd-border) !important;
  border-radius: 0 !important;
}
:deep([cmdk-input-wrapper] svg),
:deep([data-slot="command-input-wrapper"] svg) {
  color: var(--nd-text-disabled) !important;
  width: 12px !important;
  height: 12px !important;
  flex-shrink: 0;
  margin-left: 12px;
}
:deep(.nd-cb-input),
:deep([cmdk-input]),
:deep([data-slot="command-input"]) {
  all: unset !important;
  font-family: 'Montserrat', sans-serif !important;
  font-size: 11px !important;
  letter-spacing: 0.01em !important;
  color: var(--nd-text-primary) !important;
  padding: 9px 12px !important;
  flex: 1 !important;
  min-width: 0 !important;
  display: block !important;
}
:deep([cmdk-input]::placeholder),
:deep([data-slot="command-input"]::placeholder) { color: var(--nd-text-disabled) !important; }

:deep(.nd-cb-list) {
  max-height: 200px !important;
  overflow-y: auto !important;
  padding: 4px !important;
}
:deep(.nd-cb-group) { padding: 0 !important; }
:deep([data-slot="command-group-heading"]),
:deep([cmdk-group-heading]) { display: none !important; }

:deep(.nd-cb-empty) {
  font-family: 'Montserrat', sans-serif !important;
  font-size: 10px !important;
  letter-spacing: 0.02em !important;
  color: var(--nd-text-disabled) !important;
  text-align: center !important;
  padding: 14px 12px !important;
}

:deep(.nd-cb-item) {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-family: 'Montserrat', sans-serif !important;
  font-size: 13px !important;
  color: var(--nd-text-secondary) !important;
  padding: 7px 10px !important;
  border-radius: 3px !important;
  cursor: pointer !important;
  background: transparent !important;
  transition: background 80ms ease-out, color 80ms ease-out !important;
  user-select: none !important;
}
:deep(.nd-cb-item[data-highlighted]),
:deep(.nd-cb-item:hover) {
  background: var(--nd-surface-raised) !important;
  color: var(--nd-text-primary) !important;
}

.nd-cb-check {
  color: var(--nd-success);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 100ms ease-out;
}
.nd-cb-check--on { opacity: 1; }
</style>
