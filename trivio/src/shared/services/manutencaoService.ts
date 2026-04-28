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
  startTime?: string  // ISO 8601 — "2026-04-28T08:00:00.000Z"
  endTime?: string    // ISO 8601 — "2026-04-28T16:00:00.000Z"
}

export interface ManutencaoRequest {
  contractId: number
  date: string
  preventive: boolean
  type: ManutencaoTipo
  status: ManutencaoStatus
  employeeIds: number[]
  startTime?: string  // ISO 8601
  endTime?: string    // ISO 8601
}

export const manutencaoService = {
  listar: () => api.get<ManutencaoAPI[]>('/maintenances'),
  listarPorSemana: (startDate: string, endDate: string) =>
    api.get<ManutencaoAPI[]>(`/maintenances?startDate=${startDate}&endDate=${endDate}`),
  buscar: (id: number) => api.get<ManutencaoAPI>(`/maintenances/${id}`),
  criar: (data: ManutencaoRequest) => api.postResponse<void>('/maintenances', data),
  atualizar: (id: number, data: ManutencaoRequest) => api.patch<void>(`/maintenances/${id}`, data),
}
