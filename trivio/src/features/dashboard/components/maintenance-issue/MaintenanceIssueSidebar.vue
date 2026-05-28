<script setup lang="ts">
import { computed } from 'vue'
import { Building2, Calendar, Clock, MapPin, Tag, UserPlus, Users } from 'lucide-vue-next'
import type { ManutencaoAPI, ManutencaoTipo } from '@/shared/services/manutencaoService'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'
import NdMultiCombobox from '@/shared/components/ui/NdMultiCombobox.vue'

interface SelectOption {
  value: string | number
  label: string
}

const props = defineProps<{
  manutencao: ManutencaoAPI
  tipoLabel: string
  statusLabel: string
  dateLabel: string
  timeLabel: string
  addressLabel: string
  addressLoading?: boolean
  editing?: boolean
  editDate: string
  editType: ManutencaoTipo
  editStartTime: string
  editEndTime: string
  employeeIds: number[]
  tecnicoOptions: SelectOption[]
}>()

const emit = defineEmits<{
  'update:editDate': [value: string]
  'update:editType': [value: ManutencaoTipo]
  'update:editStartTime': [value: string]
  'update:editEndTime': [value: string]
  'update:employeeIds': [value: number[]]
}>()

const selectedEmployeeIds = computed<(string | number)[]>({
  get: () => props.employeeIds,
  set: value => emit('update:employeeIds', value.map(Number)),
})

const selectedType = computed<string | number | null>({
  get: () => props.editType,
  set: value => emit('update:editType', (value as ManutencaoTipo | null) ?? 'PREVENTIVA'),
})

const typeOptions = [
  { value: 'PREVENTIVA', label: 'Preventiva' },
  { value: 'CORRETIVA', label: 'Corretiva' },
  { value: 'MELHORIA', label: 'Melhoria' },
]

const displayPeople = computed(() => {
  if (!props.editing) return props.manutencao.employees

  return props.employeeIds.map(id => {
    const existing = props.manutencao.employees.find(employee => employee.employeeId === id)
    if (existing) return existing

    const option = props.tecnicoOptions.find(item => Number(item.value) === id)
    return {
      employeeId: id,
      name: option?.label ?? `#${id}`,
      email: '',
      admin: false,
      active: true,
    }
  })
})

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

function hashColor(id: number): string {
  const palette = ['var(--nd-interactive)', 'var(--nd-action)', 'var(--nd-warning)', 'var(--nd-success)', 'var(--nd-accent)']
  return palette[id % palette.length]!
}

function roleLabel(admin: boolean) {
  return admin ? 'Relator' : 'Responsável'
}
</script>

<template>
  <aside class="mi-sidebar">
    <section class="mi-sidebar-section">
      <h3>Detalhes</h3>

      <dl class="mi-detail-list">
        <div class="mi-detail-row">
          <dt><Calendar :size="15" />Data</dt>
          <dd v-if="editing">
            <input
              :value="editDate"
              type="date"
              class="mi-edit-field"
              @input="emit('update:editDate', ($event.target as HTMLInputElement).value)"
            />
          </dd>
          <dd v-else>{{ dateLabel }}</dd>
        </div>

        <div class="mi-detail-row">
          <dt><Clock :size="15" />Horário</dt>
          <dd v-if="editing" class="mi-time-fields">
            <input
              :value="editStartTime"
              type="time"
              class="mi-edit-field"
              @input="emit('update:editStartTime', ($event.target as HTMLInputElement).value)"
            />
            <span>-</span>
            <input
              :value="editEndTime"
              type="time"
              class="mi-edit-field"
              @input="emit('update:editEndTime', ($event.target as HTMLInputElement).value)"
            />
          </dd>
          <dd v-else>{{ timeLabel }}</dd>
        </div>

        <div class="mi-detail-row">
          <dt><Tag :size="15" />Tipo</dt>
          <dd v-if="editing">
            <NdCombobox
              v-model="selectedType"
              :options="typeOptions"
              placeholder="Selecione o tipo"
            />
          </dd>
          <dd v-else><span class="mi-pill">{{ tipoLabel }}</span></dd>
        </div>

        <div class="mi-detail-row">
          <dt><Building2 :size="15" />Contrato</dt>
          <dd>
            <span :class="{ 'mi-readonly-field': editing }">
              #{{ String(manutencao.contract.id).padStart(3, '0') }}
            </span>
          </dd>
        </div>

        <div class="mi-detail-row">
          <dt><MapPin :size="15" />Endereço</dt>
          <dd :class="{ 'mi-muted': addressLoading }">
            <span :class="{ 'mi-readonly-field': editing }">
              {{ addressLoading ? 'Carregando...' : addressLabel }}
            </span>
          </dd>
        </div>
      </dl>
    </section>

    <section class="mi-sidebar-section">
      <div class="mi-sidebar-title-row">
        <h3>Pessoas</h3>
        <div v-if="editing" class="mi-add-person">
          <UserPlus :size="13" />
          <NdMultiCombobox
            v-model="selectedEmployeeIds"
            :options="tecnicoOptions"
            placeholder="Adicionar"
            search-placeholder="Buscar técnico..."
            singular-label="técnico"
            plural-label="técnicos"
          />
        </div>
      </div>

      <div v-if="displayPeople.length" class="mi-people-list">
        <div v-for="employee in displayPeople" :key="employee.employeeId" class="mi-person">
          <div class="mi-avatar" :style="{ background: hashColor(employee.employeeId) }">
            {{ initials(employee.name) }}
          </div>
          <div class="mi-person-text">
            <strong>{{ employee.name }}</strong>
            <input v-if="editing" :value="roleLabel(employee.admin)" class="mi-person-role" readonly />
            <span v-else>{{ roleLabel(employee.admin) }}</span>
          </div>
        </div>
      </div>

      <p v-else class="mi-empty">
        <Users :size="15" />
        Nenhum técnico alocado
      </p>
    </section>

    <section class="mi-sidebar-section mi-activity-section">
      <h3>Atividade</h3>

      <div class="mi-activity-row">
        <span class="mi-activity-dot"></span>
        <span>Status atual</span>
        <strong>{{ statusLabel }}</strong>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.mi-sidebar {
  display: flex;
  min-height: 0;
  border-left: 1px solid var(--nd-border);
  background: var(--nd-surface);
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

.mi-sidebar-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mi-add-person {
  display: flex;
  align-items: center;
  width: 150px;
  gap: 6px;
  color: var(--nd-interactive);
  font-size: 0.72rem;
}

.mi-add-person :deep(.nd-cb-trigger) {
  border-bottom: 0;
  padding: 0;
  color: var(--nd-interactive);
}

.mi-add-person :deep(.nd-cb-placeholder),
.mi-add-person :deep(.nd-cb-value),
.mi-add-person :deep(.nd-cb-icon) {
  color: var(--nd-interactive);
  font-size: 0.72rem;
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

.mi-edit-field,
.mi-readonly-field,
.mi-person-role {
  width: 100%;
  min-height: 30px;
  border: 1px solid var(--nd-border);
  border-radius: 10px;
  padding: 0 10px;
  color: var(--nd-text-primary);
  background: var(--nd-bg);
  outline: none;
}

.mi-time-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
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
  border-radius: 50%;
  color: white;
  font-size: 0.72rem;
  font-weight: 800;
  flex: 0 0 auto;
}

.mi-person-text {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 4px;
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

.mi-person-role {
  min-height: 22px;
  font-size: 0.68rem;
}

.mi-empty {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--nd-text-secondary);
  font-size: 0.8rem;
}

.mi-activity-section {
  border-bottom: 0;
}

.mi-activity-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--nd-text-secondary);
  font-size: 0.72rem;
}

.mi-activity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--nd-success);
  flex: 0 0 auto;
}

.mi-activity-row strong {
  color: var(--nd-text-primary);
  font-weight: 800;
}

@media (max-width: 900px) {
  .mi-sidebar {
    border-top: 1px solid var(--nd-border);
    border-left: 0;
  }
}
</style>
