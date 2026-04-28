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

const calendarCells = computed<{day: number, date: Date, currentMonth: boolean}[]>(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  const jsDay = firstDay.getDay()
  const offset = jsDay === 0 ? 6 : jsDay - 1

  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear.value, viewMonth.value, 0).getDate()

  const cells: {day: number, date: Date, currentMonth: boolean}[] = []
  
  for (let i = offset - 1; i >= 0; i--) {
    cells.push({ 
      day: daysInPrevMonth - i, 
      date: new Date(viewYear.value, viewMonth.value - 1, daysInPrevMonth - i),
      currentMonth: false 
    })
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ 
      day: d, 
      date: new Date(viewYear.value, viewMonth.value, d),
      currentMonth: true 
    })
  }
  
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ 
      day: i, 
      date: new Date(viewYear.value, viewMonth.value + 1, i),
      currentMonth: false 
    })
  }
  
  return cells
})

const selectedWeekRange = computed(() => {
  const start = new Date(props.monday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
})

function isInSelectedWeek(cell: {date: Date}): boolean {
  return cell.date >= selectedWeekRange.value.start && cell.date <= selectedWeekRange.value.end
}

function onDayClick(cell: {date: Date}) {
  emit('semana-click', cell.date)
}

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

const legendItems = [
  { label: 'Agendada', color: 'var(--nd-action)' },
  { label: 'Em andamento', color: 'var(--nd-warning)' },
  { label: 'Concluída', color: 'var(--nd-success)' },
  { label: 'Atrasada', color: 'var(--nd-accent)' },
]
</script>

<template>
  <aside class="cp-sidebar">
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
        <div
          v-for="(h, i) in DAY_HEADERS"
          :key="`h-${i}`"
          class="cp-day-header"
        >
          {{ h }}
        </div>

        <template v-for="(cell, idx) in calendarCells" :key="`c-${idx}`">
          <button
            type="button"
            class="cp-day-btn"
            :class="{ 
              'cp-day-btn--active': isInSelectedWeek(cell),
              'cp-day-btn--other-month': !cell.currentMonth
            }"
            @click="onDayClick(cell)"
          >
            {{ cell.day }}
          </button>
        </template>
      </div>
    </section>

    <section class="cp-section">
      <p class="cp-section-label">TÉCNICO</p>
      <NdCombobox
        v-model="tecnicoModel"
        :options="tecnicoOptions"
        placeholder="Todos os técnicos"
        search-placeholder="Buscar técnico..."
      />
    </section>

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

.cp-section {
  padding: 12px;
  border-bottom: 1px solid var(--nd-border);
}
.cp-section--last {
  border-bottom: none;
}

.cp-section-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--nd-text-secondary);
  margin: 0 0 8px 0;
}

.cp-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cp-month-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
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

.cp-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px 0;
}

.cp-day-header {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
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
  font-size: 11px;
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

.cp-day-btn--other-month {
  color: var(--nd-text-disabled);
  opacity: 0.6;
}

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
  font-size: 12px;
  color: var(--nd-text-secondary);
}
</style>
