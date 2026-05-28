<script setup lang="ts">
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

const props = defineProps<{
  statusLabel: string
  statusColor: string
  typeLabel: string
  titleLabel: string
  clientName: string
  editing?: boolean
  statusValue: string
  typeValue: string
}>()

const emit = defineEmits<{
  'update:statusValue': [value: string]
  'update:typeValue': [value: string]
}>()

const title = computed(() => `${props.titleLabel} - ${props.clientName}`)

const statusModel = computed({
  get: () => props.statusValue,
  set: value => emit('update:statusValue', value),
})

const typeModel = computed({
  get: () => props.typeValue,
  set: value => emit('update:typeValue', value),
})

const statusOptions = [
  { value: 'SCHEDULED', label: 'Agendada' },
  { value: 'STARTED', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluída' },
]

const typeOptions = [
  { value: 'PREVENTIVA', label: 'Preventiva' },
  { value: 'CORRETIVA', label: 'Corretiva' },
  { value: 'MELHORIA', label: 'Melhoria' },
]
</script>

<template>
  <div class="mi-header-block">
    <section class="mi-title-section">
      <div class="mi-badges">
        <Select
          v-if="editing"
          v-model="statusModel"
        >
          <SelectTrigger class="mi-badge-trigger mi-status" :style="{ color: statusColor, borderColor: statusColor }">
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="mi-select-content">
            <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value" class="mi-select-item">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span v-else class="mi-status" :style="{ color: statusColor, borderColor: statusColor }">
          {{ statusLabel }}
        </span>

        <Select
          v-if="editing"
          v-model="typeModel"
        >
          <SelectTrigger class="mi-badge-trigger mi-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="mi-select-content">
            <SelectItem v-for="option in typeOptions" :key="option.value" :value="option.value" class="mi-select-item">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span v-else class="mi-type">{{ typeLabel }}</span>
      </div>

      <div v-if="editing" class="mi-title-input">{{ title }}</div>
      <h2 v-else>{{ title }}</h2>
    </section>
  </div>
</template>

<style scoped>
.mi-header-block {
  display: grid;
  min-width: 0;
}

.mi-title-section {
  display: grid;
  gap: 10px;
  min-height: 104px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.mi-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.mi-status,
.mi-type {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 800;
}

.mi-badge-trigger {
  width: auto;
  height: 24px;
  min-height: 24px;
  gap: 6px;
  border-radius: 4px;
  padding: 0 8px 0 10px;
  box-shadow: none;
  font-size: 0.68rem;
  font-weight: 800;
}

.mi-badge-trigger :deep(svg) {
  width: 12px;
  height: 12px;
  opacity: 0.8;
}

.mi-status {
  border: 1px solid;
  text-transform: uppercase;
}

.mi-type {
  border: 1px solid var(--nd-border-visible);
  color: var(--nd-interactive);
  background: var(--nd-surface-raised);
}

.mi-title-section h2 {
  margin: 0;
  color: var(--nd-text-primary);
  font-size: 1.24rem;
  font-weight: 800;
  line-height: 1.2;
}

.mi-title-input {
  display: flex;
  align-items: center;
  min-width: 0;
  border: 1px solid var(--nd-border);
  border-radius: 10px;
  background: var(--nd-bg);
  color: var(--nd-text-primary);
}

.mi-title-input {
  min-height: 44px;
  padding: 0 12px;
  font-size: 1.24rem;
  font-weight: 800;
}

:global(.mi-select-content) {
  border-color: var(--nd-border-visible);
  border-radius: 4px;
  background: var(--nd-surface-raised);
}

:global(.mi-select-item) {
  color: var(--nd-text-primary);
  font-size: 0.78rem;
}

:global(.mi-select-item[data-state="checked"]) {
  color: var(--nd-text-primary);
}

:global(.mi-select-item[data-highlighted]) {
  color: #0b0f14;
}

@media (max-width: 720px) {
  .mi-title-section {
    padding: 16px;
  }
}
</style>
