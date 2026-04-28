<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'
import type { ComboboxOption } from '@/shared/components/ui/NdCombobox.vue'
import type { TecnicoAPI } from '@/shared/services/tecnicoService'

const props = defineProps<{
  monday: Date
  tecnicos: TecnicoAPI[]
  tecnicoFiltro: TecnicoAPI | null
}>()

const emit = defineEmits<{
  'update:tecnicoFiltro': [value: TecnicoAPI | null]
  'semana-click': [date: Date]
}>()

// ── Mini Calendar state ───────────────────────────────────────
const viewMonth = ref(0)
const viewYear = ref(0)

watch(
  () => props.monday,
  (newMonday) => {
    viewMonth.value = newMonday.getMonth()
    viewYear.value = newMonday.getFullYear()
  },
  { immediate: true },
)

const MONTH_NAMES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

// Day headers: Mon-based (S T Q Q S S D)
const DAY_HEADERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

const monthLabel = computed(() => `${MONTH_NAMES[viewMonth.value]} ${viewYear.value}`)

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

// Build calendar cells: leading nulls + day numbers
const calendarCells = computed<(number | null)[]>(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  // JS getDay(): 0=Sun, 1=Mon ... 6=Sat
  // Mon-based offset: Mon=0 ... Sun=6
  const jsDay = firstDay.getDay()
  const offset = jsDay === 0 ? 6 : jsDay - 1

  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
})

// Compute selected week boundaries once per monday change (not per-cell)
const selectedWeekRange = computed(() => {
  const start = new Date(props.monday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
})

function isInSelectedWeek(day: number): boolean {
  const cellDate = new Date(viewYear.value, viewMonth.value, day)
  return cellDate >= selectedWeekRange.value.start && cellDate <= selectedWeekRange.value.end
}

function onDayClick(day: number) {
  const date = new Date(viewYear.value, viewMonth.value, day)
  emit('semana-click', date)
}

// ── Technician filter ─────────────────────────────────────────
const tecnicoOptions = computed<ComboboxOption[]>(() => [
  { value: -1, label: 'Todos os técnicos' },
  ...props.tecnicos.map((t) => ({ value: t.employeeId, label: t.name })),
])

const tecnicoModel = computed<string | number | null>({
  get() {
    return props.tecnicoFiltro?.employeeId ?? -1
  },
  set(val) {
    if (val === -1 || val === null) {
      emit('update:tecnicoFiltro', null)
    } else {
      const found = props.tecnicos.find((t) => t.employeeId === val) ?? null
      emit('update:tecnicoFiltro', found)
    }
  },
})

// ── Legend items ──────────────────────────────────────────────
const legendItems = [
  { label: 'Agendada', color: 'var(--nd-action)' },
  { label: 'Em andamento', color: 'var(--nd-warning)' },
  { label: 'Concluída', color: 'var(--nd-success)' },
  { label: 'Atrasada', color: 'var(--nd-accent)' },
]
</script>

<template>
  <aside class="cp-sidebar">
    <!-- ── Section 1: Mini Calendar ────────────────────────── -->
    <section class="cp-section">
      <div class="cp-cal-header">
        <button type="button" class="cp-nav-btn" @click="prevMonth">
          <ChevronLeft :size="14" />
        </button>
        <span class="cp-month-label">{{ monthLabel }}</span>
        <button type="button" class="cp-nav-btn" @click="nextMonth">
          <ChevronRight :size="14" />
        </button>
      </div>

      <div class="cp-cal-grid">
        <!-- Day headers -->
        <div
          v-for="(h, i) in DAY_HEADERS"
          :key="`h-${i}`"
          class="cp-day-header"
        >
          {{ h }}
        </div>

        <!-- Calendar cells -->
        <template v-for="(cell, idx) in calendarCells" :key="`c-${idx}`">
          <div v-if="cell === null" class="cp-day-blank" />
          <button
            v-else
            type="button"
            class="cp-day-btn"
            :class="{ 'cp-day-btn--active': isInSelectedWeek(cell) }"
            @click="onDayClick(cell)"
          >
            {{ cell }}
          </button>
        </template>
      </div>
    </section>

    <!-- ── Section 2: Technician filter ───────────────────── -->
    <section class="cp-section">
      <p class="cp-section-label">TÉCNICO</p>
      <NdCombobox
        v-model="tecnicoModel"
        :options="tecnicoOptions"
        placeholder="Todos os técnicos"
        search-placeholder="Buscar técnico..."
      />
    </section>

    <!-- ── Section 3: Legend ──────────────────────────────── -->
    <section class="cp-section cp-section--last">
      <p class="cp-section-label">LEGENDA</p>
      <ul class="cp-legend-list">
        <li
          v-for="item in legendItems"
          :key="item.label"
          class="cp-legend-item"
        >
          <span class="cp-legend-dot" :style="{ background: item.color }" />
          <span class="cp-legend-text">{{ item.label }}</span>
        </li>
      </ul>
    </section>
  </aside>
</template>

<style scoped>
/* ── Sidebar container ───────────────────────────────────────── */
.cp-sidebar {
  width: 200px;
  min-width: 200px;
  border: 1px solid var(--nd-border-visible);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
  background: var(--nd-surface);
}

/* ── Sections ────────────────────────────────────────────────── */
.cp-section {
  padding: 12px;
  border-bottom: 1px solid var(--nd-border);
}
.cp-section--last {
  border-bottom: none;
}

/* ── Section label ───────────────────────────────────────────── */
.cp-section-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--nd-text-secondary);
  margin: 0 0 8px 0;
}

/* ── Calendar header ─────────────────────────────────────────── */
.cp-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cp-month-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--nd-text-primary);
  text-transform: lowercase;
}

.cp-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--nd-text-secondary);
  padding: 2px;
  border-radius: 3px;
  transition: color 120ms ease-out, background 120ms ease-out;
}
.cp-nav-btn:hover {
  color: var(--nd-text-primary);
  background: color-mix(in srgb, var(--nd-border) 50%, transparent);
}

/* ── Calendar grid ───────────────────────────────────────────── */
.cp-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px 0;
}

.cp-day-header {
  font-family: 'Montserrat', sans-serif;
  font-size: 9px;
  font-weight: 600;
  color: var(--nd-text-disabled);
  text-align: center;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cp-day-blank {
  width: 100%;
  height: 24px;
}

.cp-day-btn {
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 400;
  color: var(--nd-text-secondary);
  background: transparent;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: background 100ms ease-out, color 100ms ease-out;
}
.cp-day-btn:hover {
  background: color-mix(in srgb, var(--nd-border) 60%, transparent);
  color: var(--nd-text-primary);
}

.cp-day-btn--active {
  background: color-mix(in srgb, var(--nd-action) 15%, transparent);
  color: var(--nd-action);
  font-weight: 600;
}
.cp-day-btn--active:hover {
  background: color-mix(in srgb, var(--nd-action) 22%, transparent);
  color: var(--nd-action);
}

/* ── Legend ──────────────────────────────────────────────────── */
.cp-legend-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.cp-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cp-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cp-legend-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  color: var(--nd-text-secondary);
}
</style>
