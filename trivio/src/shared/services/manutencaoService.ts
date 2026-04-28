import { api } from './api'

export type ManutencaoStatus = 'SCHEDULED' | 'STARTED' | 'COMPLETED'
export type ManutencaoTipo = 'PREVENTIVA' | 'CORRETIVA' | 'MELHORIA'

export interface ManutencaoAPI {
  id: number
  contract: {
    id: number
    client: { id_client: number; name: string }
    initialDate: string
    finalDate: string
    recurrenceMaintenance: number
    active: boolean
  }
  date: string
  preventive: boolean
  type: ManutencaoTipo
  status: ManutencaoStatus
  employees: Array<{ employeeId: number; name: string; email: string; admin: boolean; active: boolean }>
  /** Full ISO 8601 timestamp for scheduled start — e.g. "2026-04-28T08:00:00.000Z". Optional. */
  startTime?: string
  /** Full ISO 8601 timestamp for scheduled end — e.g. "2026-04-28T16:00:00.000Z". Optional. */
  endTime?: string
}

export interface ManutencaoRequest {
  contractId: number
  date: string
  preventive: boolean
  type: ManutencaoTipo
  status: ManutencaoStatus
  employeeIds: number[]
  /** Full ISO 8601 timestamp — optional, for scheduled start time. */
  startTime?: string
  /** Full ISO 8601 timestamp — optional, for scheduled end time. */
  endTime?: string
}

export const manutencaoService = {
  listar: () => api.get<ManutencaoAPI[]>('/maintenances'),
  /** Fetch maintenances within a week. startDate/endDate are YYYY-MM-DD plain dates (not timestamps). */
  listarPorSemana: (startDate: string, endDate: string) => {
    const params = new URLSearchParams({ startDate, endDate })
    return api.get<ManutencaoAPI[]>(`/maintenances?${params}`)
  },
  buscar: (id: number) => api.get<ManutencaoAPI>(`/maintenances/${id}`),
  criar: (data: ManutencaoRequest) => api.postResponse<void>('/maintenances', data),
  atualizar: (id: number, data: ManutencaoRequest) => api.patch<void>(`/maintenances/${id}`, data),
}
