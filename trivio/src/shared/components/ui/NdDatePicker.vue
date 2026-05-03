<script setup lang="ts">
import { ref, watch } from 'vue'
import { CalendarIcon } from 'lucide-vue-next'
import { parseDate } from '@internationalized/date'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Calendar } from '@/shared/components/ui/calendar'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const calendarValue = ref<any>(undefined)

watch(() => props.modelValue, (value) => {
  calendarValue.value = value ? parseDate(value) : undefined
}, { immediate: true })

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const [y = '', m = '', d = ''] = dateStr.split('-')
  if (!y || !m || !d) return dateStr
  return `${d}/${m}/${y.slice(2)}`
}

function selectDate(value: any) {
  calendarValue.value = value
  emit('update:modelValue', value ? value.toString() : '')
  if (value) open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="nd-date-field"
        :class="{ 'nd-date-field--active': modelValue }"
        :aria-required="required || undefined"
      >
        <CalendarIcon :size="14" class="nd-date-field-icon" />
        <span v-if="modelValue" class="nd-date-field-value">{{ formatDate(modelValue) }}</span>
        <span v-else class="nd-date-field-placeholder">{{ placeholder || 'Selecionar data' }}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0 nd-date-field-content" side="bottom" align="start">
      <Calendar
        :model-value="calendarValue"
        layout="month-and-year"
        initial-focus
        @update:model-value="selectDate"
      />
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.nd-date-field {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--nd-border-visible);
  outline: none;
  padding: 8px 0;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  color: var(--nd-text-primary);
  cursor: pointer;
  transition: border-color 150ms ease-out;
  text-align: left;
}

.nd-date-field:hover,
.nd-date-field:focus-visible,
.nd-date-field--active {
  border-bottom-color: var(--nd-text-primary);
}

.nd-date-field-icon {
  color: var(--nd-text-disabled);
  flex-shrink: 0;
}

.nd-date-field--active .nd-date-field-icon {
  color: var(--nd-action);
}

.nd-date-field-value {
  color: var(--nd-text-primary);
}

.nd-date-field-placeholder {
  color: var(--nd-text-disabled);
}

.nd-date-field-content {
  background: var(--nd-surface);
  border: 1px solid var(--nd-border);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  font-family: 'Montserrat', sans-serif;
  z-index: 50;
}
</style>
