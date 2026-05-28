<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  statusLabel: string
  statusColor: string
  typeLabel: string
  titleLabel: string
  clientName: string
  summaryLabel: string
  editing?: boolean
  statusValue: string
  typeValue: string
}>()

const emit = defineEmits<{
  'update:statusValue': [value: string]
  'update:typeValue': [value: string]
}>()

const title = computed(() => `${props.titleLabel} - ${props.clientName}`)

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
        <select
          v-if="editing"
          :value="statusValue"
          class="mi-badge-select mi-status"
          :style="{ color: statusColor, borderColor: statusColor }"
          @change="emit('update:statusValue', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <span v-else class="mi-status" :style="{ color: statusColor, borderColor: statusColor }">
          {{ statusLabel }}
        </span>

        <select
          v-if="editing"
          :value="typeValue"
          class="mi-badge-select mi-type"
          @change="emit('update:typeValue', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <span v-else class="mi-type">{{ typeLabel }}</span>
      </div>

      <div v-if="editing" class="mi-title-input">{{ title }}</div>
      <h2 v-else>{{ title }}</h2>

      <div v-if="editing" class="mi-summary-input">{{ summaryLabel }}</div>
      <p v-else>{{ summaryLabel }}</p>
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
  min-height: 124px;
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
.mi-type,
.mi-badge-select {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 800;
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

.mi-badge-select {
  appearance: none;
  border-style: solid;
  outline: none;
  cursor: pointer;
}

.mi-title-input,
.mi-summary-input {
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

.mi-summary-input {
  min-height: 56px;
  align-items: flex-start;
  padding: 12px;
  color: var(--nd-text-secondary);
  font-size: 0.78rem;
}

.mi-title-section p {
  margin: 0;
  color: var(--nd-text-secondary);
  font-size: 0.78rem;
  line-height: 1.35;
}

@media (max-width: 720px) {
  .mi-title-section {
    padding: 16px;
  }
}
</style>
