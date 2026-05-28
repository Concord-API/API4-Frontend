<script setup lang="ts">
import { Building2, Calendar, Clock, MapPin, Tag, Users } from 'lucide-vue-next'
import type { ManutencaoAPI } from '@/shared/services/manutencaoService'

defineProps<{
  manutencao: ManutencaoAPI
  tipoLabel: string
  dateLabel: string
  timeLabel: string
  addressLabel: string
  addressLoading?: boolean
}>()

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

function hashColor(id: number): string {
  const palette = ['#7C3AED', '#0EA5E9', '#F97316', '#EC4899', '#14B8A6', '#8B5CF6', '#EF4444', '#84CC16']
  return palette[id % palette.length]!
}
</script>

<template>
  <aside class="mi-sidebar">
    <section class="mi-sidebar-section">
      <h3>Detalhes</h3>

      <dl class="mi-detail-list">
        <div class="mi-detail-row">
          <dt><Calendar :size="15" />Data</dt>
          <dd>{{ dateLabel }}</dd>
        </div>

        <div class="mi-detail-row">
          <dt><Clock :size="15" />Horario</dt>
          <dd>{{ timeLabel }}</dd>
        </div>

        <div class="mi-detail-row">
          <dt><Tag :size="15" />Tipo</dt>
          <dd><span class="mi-pill">{{ tipoLabel }}</span></dd>
        </div>

        <div class="mi-detail-row">
          <dt><Building2 :size="15" />Contrato</dt>
          <dd>#{{ String(manutencao.contract.id).padStart(3, '0') }}</dd>
        </div>

        <div class="mi-detail-row">
          <dt><MapPin :size="15" />Endereco</dt>
          <dd :class="{ 'mi-muted': addressLoading }">{{ addressLoading ? 'Carregando...' : addressLabel }}</dd>
        </div>
      </dl>
    </section>

    <section class="mi-sidebar-section">
      <h3>Pessoas</h3>

      <div v-if="manutencao.employees.length" class="mi-people-list">
        <div v-for="employee in manutencao.employees" :key="employee.employeeId" class="mi-person">
          <div class="mi-avatar" :style="{ background: hashColor(employee.employeeId) }">
            {{ initials(employee.name) }}
          </div>
          <div class="mi-person-text">
            <strong>{{ employee.name }}</strong>
            <span>{{ employee.admin ? 'Gestor' : 'Tecnico' }}</span>
          </div>
        </div>
      </div>

      <p v-else class="mi-empty">
        <Users :size="15" />
        Nenhum tecnico alocado
      </p>
    </section>
  </aside>
</template>

<style scoped>
.mi-sidebar {
  display: flex;
  min-height: 0;
  border-left: 1px solid var(--nd-border);
  background: var(--nd-surface-raised);
  overflow-y: auto;
  flex-direction: column;
}

.mi-sidebar-section {
  display: grid;
  gap: 14px;
  padding: 20px;
  border-bottom: 1px solid var(--nd-border);
}

.mi-sidebar-section h3 {
  margin: 0;
  color: var(--nd-text-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mi-detail-list {
  display: grid;
  gap: 14px;
  margin: 0;
}

.mi-detail-row {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.mi-detail-row dt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--nd-text-secondary);
  font-size: 0.78rem;
}

.mi-detail-row dd {
  margin: 0;
  min-width: 0;
  color: var(--nd-text-primary);
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.mi-pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  background: var(--nd-border-visible);
}

.mi-muted {
  color: var(--nd-text-secondary) !important;
  font-style: italic;
}

.mi-people-list {
  display: grid;
  gap: 14px;
}

.mi-person {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mi-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  flex: 0 0 auto;
}

.mi-person-text {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.mi-person-text strong {
  min-width: 0;
  color: var(--nd-text-primary);
  font-size: 0.84rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mi-person-text span {
  color: var(--nd-text-secondary);
  font-size: 0.72rem;
}

.mi-empty {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--nd-text-secondary);
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .mi-sidebar {
    border-top: 1px solid var(--nd-border);
    border-left: 0;
  }
}
</style>
