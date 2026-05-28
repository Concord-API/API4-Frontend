<script setup lang="ts">
import { computed } from 'vue'
import { Edit2 } from 'lucide-vue-next'
import type { ManutencaoAPI } from '@/shared/services/manutencaoService'

const props = defineProps<{
  manutencao: ManutencaoAPI
  statusLabel: string
  statusColor: string
  tipoLabel: string
  canEdit?: boolean
}>()

const emit = defineEmits<{
  edit: []
}>()

const title = computed(() => `${props.tipoLabel} - ${props.manutencao.contract.client.name}`)
</script>

<template>
  <div class="mi-header-block">
    <header class="mi-header">
      <div class="mi-breadcrumb">
        <span>Contratos</span>
        <span>/</span>
        <span>{{ manutencao.contract.client.name }}</span>
        <span>/</span>
        <strong># MNT-{{ String(manutencao.id).padStart(3, '0') }}</strong>
      </div>

      <div class="mi-actions">
        <button v-if="canEdit" type="button" class="mi-icon-button" title="Editar" @click="emit('edit')">
          <Edit2 :size="16" />
        </button>
      </div>
    </header>

    <section class="mi-title-section">
      <div class="mi-badges">
        <span class="mi-status" :style="{ color: statusColor, borderColor: statusColor }">
          {{ statusLabel }}
        </span>
        <span class="mi-type">{{ tipoLabel }}</span>
      </div>

      <h2>{{ title }}</h2>
    </section>
  </div>
</template>

<style scoped>
.mi-header-block {
  display: grid;
  min-width: 0;
}

.mi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 0 24px;
  border-bottom: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.mi-breadcrumb {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
  color: var(--nd-text-secondary);
  font-size: 0.78rem;
}

.mi-breadcrumb span,
.mi-breadcrumb strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mi-breadcrumb strong {
  color: var(--nd-text-primary);
  font-weight: 700;
}

.mi-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.mi-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--nd-text-secondary);
  background: transparent;
  cursor: pointer;
}

.mi-icon-button:hover {
  border-color: var(--nd-border);
  color: var(--nd-text-primary);
  background: var(--nd-surface-raised);
}

.mi-title-section {
  display: grid;
  gap: 12px;
  padding: 20px 24px 18px;
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
  font-size: 0.7rem;
  font-weight: 800;
}

.mi-status {
  border: 1px solid;
  text-transform: uppercase;
}

.mi-type {
  border: 1px solid var(--nd-border);
  color: var(--nd-text-primary);
  background: var(--nd-surface-raised);
}

.mi-title-section h2 {
  margin: 0;
  color: var(--nd-text-primary);
  font-size: 1.28rem;
  font-weight: 800;
  line-height: 1.2;
}

@media (max-width: 720px) {
  .mi-header {
    padding: 0 16px;
  }

  .mi-title-section {
    padding: 16px;
  }
}
</style>
