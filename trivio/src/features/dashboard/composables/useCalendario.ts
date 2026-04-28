import { ref, computed } from 'vue'
import { manutencaoService, type ManutencaoAPI } from '@/shared/services/manutencaoService'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { getApiErrorMessage } from '@/shared/services/api'

export const GRID_START_HOUR = 6
export const GRID_END_HOUR = 22
export const ROW_HEIGHT_PX = 48

export interface DiaDaSemana {
  date: Date
  label: string    // "seg", "ter", etc.
  dateStr: string  // "YYYY-MM-DD"
  isToday: boolean
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildDays(monday: Date): DiaDaSemana[] {
  const labels = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
  const today = toDateStr(new Date())
  return labels.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = toDateStr(d)
    return { date: d, label, dateStr, isToday: dateStr === today }
  })
}

export function useSemanaLabel(monday: Date): string {
  const end = new Date(monday)
  end.setDate(monday.getDate() + 6)
  const fmtDay = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][d.getMonth()]}`
  if (monday.getMonth() === end.getMonth()) {
    return `${String(monday.getDate()).padStart(2, '0')}–${fmtDay(end)} ${monday.getFullYear()}`
  }
  return `${fmtDay(monday)} – ${fmtDay(end)} ${end.getFullYear()}`
}

export function useCalendario() {
  const monday = ref<Date>(getMonday(new Date()))
  const tecnicoFiltro = ref<TecnicoAPI | null>(null)
  const tecnicos = ref<TecnicoAPI[]>([])
  const manutencoesDaSemana = ref<ManutencaoAPI[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const diasDaSemana = computed(() => buildDays(monday.value))

  const semanaLabel = computed(() => useSemanaLabel(monday.value))

  const manutencoesFiltradas = computed(() => {
    if (!tecnicoFiltro.value) return manutencoesDaSemana.value
    const id = tecnicoFiltro.value.employeeId
    return manutencoesDaSemana.value.filter(m => m.employees.some(e => e.employeeId === id))
  })

  async function carregarSemana() {
    loading.value = true
    error.value = null
    try {
      const startDate = toDateStr(monday.value)
      const endDate = toDateStr(diasDaSemana.value[6]!.date)
      manutencoesDaSemana.value = await manutencaoService.listarPorSemana(startDate, endDate)
    } catch (err) {
      error.value = getApiErrorMessage(err, 'Não foi possível carregar a agenda.')
    } finally {
      loading.value = false
    }
  }

  async function carregarTecnicos() {
    try {
      tecnicos.value = await tecnicoService.listar()
    } catch {
      // silent — filtro de técnico simplesmente não popula
    }
  }

  function navegarSemana(direcao: -1 | 0 | 1) {
    if (direcao === 0) {
      monday.value = getMonday(new Date())
    } else {
      const next = new Date(monday.value)
      next.setDate(monday.value.getDate() + direcao * 7)
      monday.value = next
    }
    void carregarSemana()
  }

  function irParaSemanaDosDia(date: Date) {
    monday.value = getMonday(date)
    void carregarSemana()
  }

  return {
    monday,
    diasDaSemana,
    semanaLabel,
    tecnicoFiltro,
    tecnicos,
    manutencoesDaSemana,
    manutencoesFiltradas,
    loading,
    error,
    carregarSemana,
    carregarTecnicos,
    navegarSemana,
    irParaSemanaDosDia,
  }
}
