import { ref, computed, readonly } from 'vue'
import { manutencaoService, type ManutencaoAPI } from '@/shared/services/manutencaoService'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { getApiErrorMessage } from '@/shared/services/api'

export const GRID_START_HOUR = 0
export const GRID_END_HOUR = 23
export const ROW_HEIGHT_PX = 48

export interface DiaDaSemana {
  date: Date
  label: string
  dateStr: string
  isToday: boolean
}

function getSunday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildDays(sunday: Date): DiaDaSemana[] {
  const labels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  const today = toDateStr(new Date())
  return labels.map((label, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const dateStr = toDateStr(d)
    return { date: d, label, dateStr, isToday: dateStr === today }
  })
}

function formatSemanaLabel(sunday: Date): string {
  const end = new Date(sunday)
  end.setDate(sunday.getDate() + 6)
  const fmtDay = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][d.getMonth()]}`
  if (sunday.getFullYear() !== end.getFullYear()) {
    return `${fmtDay(sunday)} ${sunday.getFullYear()} – ${fmtDay(end)} ${end.getFullYear()}`
  }
  if (sunday.getMonth() === end.getMonth()) {
    return `${String(sunday.getDate()).padStart(2, '0')}–${fmtDay(end)} ${sunday.getFullYear()}`
  }
  return `${fmtDay(sunday)} – ${fmtDay(end)} ${end.getFullYear()}`
}

export function useCalendario() {
  const sunday = ref<Date>(getSunday(new Date()))
  const tecnicoFiltro = ref<TecnicoAPI | null>(null)
  const tecnicos = ref<TecnicoAPI[]>([])
  const manutencoesDaSemana = ref<ManutencaoAPI[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const diasDaSemana = computed(() => buildDays(sunday.value))

  const semanaLabel = computed(() => formatSemanaLabel(sunday.value))

  const manutencoesFiltradas = computed(() => {
    if (!tecnicoFiltro.value) return manutencoesDaSemana.value
    const id = tecnicoFiltro.value.employeeId
    return manutencoesDaSemana.value.filter(m => m.employees.some(e => e.employeeId === id))
  })

  async function carregarSemana() {
    loading.value = true
    error.value = null
    try {
      const startDate = toDateStr(sunday.value)
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
    }
  }

  function navegarSemana(direcao: -1 | 0 | 1) {
    if (direcao === 0) {
      sunday.value = getSunday(new Date())
    } else {
      const next = new Date(sunday.value)
      next.setDate(sunday.value.getDate() + direcao * 7)
      sunday.value = next
    }
    void carregarSemana()
  }

  function irParaSemanaDoDia(date: Date) {
    sunday.value = getSunday(date)
    void carregarSemana()
  }

  return {
    sunday: readonly(sunday),
    diasDaSemana,
    semanaLabel,
    tecnicoFiltro,
    tecnicos,
    manutencoesDaSemana: readonly(manutencoesDaSemana),
    manutencoesFiltradas,
    loading,
    error,
    carregarSemana,
    carregarTecnicos,
    navegarSemana,
    irParaSemanaDoDia,
  }
}
