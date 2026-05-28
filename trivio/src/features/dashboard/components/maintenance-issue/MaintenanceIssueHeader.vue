<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  statusLabel: string
  statusColor: string
  typeLabel: string
  titleLabel: string
  clientName: string
  summaryLabel: string
}>()

const title = computed(() => `${props.titleLabel} - ${props.clientName}`)
</script>

<template>
  <div class="mi-header-block">
    <section class="mi-title-section">
      <div class="mi-badges">
        <span class="mi-status" :style="{ color: statusColor, borderColor: statusColor }">
          {{ statusLabel }}
        </span>
        <span class="mi-type">{{ typeLabel }}</span>
      </div>

      <h2>{{ title }}</h2>
      <p>{{ summaryLabel }}</p>
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
.mi-type {
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
