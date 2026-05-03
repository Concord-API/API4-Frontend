<script setup lang="ts">
import { ref, watch } from 'vue'
import { CalendarIcon } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { RangeCalendar } from '@/shared/components/ui/range-calendar'
import { parseDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import type { DateRange as RadixDateRange } from 'reka-ui'

export interface DateRange {
  start: string
  end: string
}

const props = defineProps<{
  modelValue: DateRange | null
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DateRange | null]
}>()

const open = ref(false)

const calendarValue = ref<any>(undefined)

watch(() => props.modelValue, (val) => {
  if (val && val.start && val.end) {
    calendarValue.value = {
      start: parseDate(val.start),
      end: parseDate(val.end)
    }
  } else if (val && val.start) {
    calendarValue.value = {
      start: parseDate(val.start),
      end: undefined as unknown as DateValue
    }
  } else {
    calendarValue.value = undefined
  }
}, { immediate: true })

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const [y = '', m = '', d = ''] = dateStr.split('-')
  if (!y || !m || !d) return dateStr
  return `${d}/${m}/${y.slice(2)}`
}

function apply() {
  if (calendarValue.value?.start) {
    const startStr = calendarValue.value.start.toString()
    const endStr = calendarValue.value.end ? calendarValue.value.end.toString() : startStr
    emit('update:modelValue', { 
      start: startStr, 
      end: endStr 
    })
  } else {
    emit('update:modelValue', null)
  }
  open.value = false
}

function clear() {
  calendarValue.value = undefined
  emit('update:modelValue', null)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button class="nd-date-picker-btn" :class="{ 'nd-date-picker-btn--active': modelValue?.start || modelValue?.end }">
        <CalendarIcon :size="14" class="nd-date-picker-icon" />
        <span v-if="modelValue?.start || modelValue?.end" class="nd-date-picker-value">
          <template v-if="modelValue.start && modelValue.end && modelValue.start !== modelValue.end">
            {{ formatDate(modelValue.start) }} - {{ formatDate(modelValue.end) }}
          </template>
          <template v-else>
            {{ formatDate(modelValue.start || modelValue.end) }}
          </template>
        </span>
        <span v-else class="nd-date-picker-placeholder">{{ placeholder || 'Período' }}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0 nd-date-picker-content" side="bottom" align="start">
      <RangeCalendar v-model="calendarValue" initial-focus />
      <div class="nd-dp-footer">
        <button type="button" class="nd-dp-btn-clear" @click="clear">Limpar</button>
        <button type="button" class="nd-dp-btn-apply" @click="apply">Aplicar</button>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.nd-date-picker-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--nd-surface);
  border: 1px solid var(--nd-border);
  border-radius: 6px;
  padding: 0 12px;
  height: 32px;
  cursor: pointer;
  transition: border-color 150ms ease-out, background 150ms ease-out;
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  white-space: nowrap;
  min-width: 140px;
}

.nd-date-picker-btn:hover {
  border-color: var(--nd-border-visible);
}

.nd-date-picker-btn--active {
  border-color: var(--nd-action);
  background: color-mix(in srgb, var(--nd-action) 5%, var(--nd-surface));
}

.nd-date-picker-icon {
  color: var(--nd-text-disabled);
}

.nd-date-picker-btn--active .nd-date-picker-icon {
  color: var(--nd-action);
}

.nd-date-picker-placeholder {
  color: var(--nd-text-disabled);
}

.nd-date-picker-value {
  color: var(--nd-text-primary);
  font-weight: 500;
}

.nd-date-picker-content {
  background: var(--nd-surface);
  border: 1px solid var(--nd-border);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  font-family: 'Montserrat', sans-serif;
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.nd-dp-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--nd-border-visible);
}

.nd-dp-btn-clear {
  background: transparent;
  border: 1px solid var(--nd-border-visible);
  border-radius: 4px;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  color: var(--nd-text-secondary);
  cursor: pointer;
  transition: background 150ms ease-out, color 150ms ease-out;
}

.nd-dp-btn-clear:hover {
  background: var(--nd-surface-raised, #f3f4f6);
  color: var(--nd-text-primary);
}

:root.dark .nd-dp-btn-clear:hover,
.dark .nd-dp-btn-clear:hover {
  background: rgba(255, 255, 255, 0.05);
}

.nd-dp-btn-apply {
  background: var(--nd-action);
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  color: var(--nd-action-foreground);
  cursor: pointer;
  transition: background 150ms ease-out;
}

.nd-dp-btn-apply:hover {
  background: var(--nd-action-hover);
}
</style>
