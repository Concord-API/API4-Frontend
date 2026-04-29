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
  startTime?: string
  endTime?: string
  latitude?: number
  longitude?: number
}

export interface ManutencaoRequest {
  contractId: number
  date: string
  preventive: boolean
  type: ManutencaoTipo
  status: ManutencaoStatus
  employeeIds: number[]
  startTime?: string
  endTime?: string
  latitude?: number
  longitude?: number
}

export const manutencaoService = {
  listar: () => api.get<ManutencaoAPI[]>('/maintenances'),
  listarPorSemana: (startDate: string, endDate: string) => {
    const params = new URLSearchParams({ startDate, endDate })
    return api.get<ManutencaoAPI[]>(`/maintenances?${params}`)
  },
  buscar: (id: number) => api.get<ManutencaoAPI>(`/maintenances/${id}`),
  criar: (data: ManutencaoRequest) => api.postResponse<void>('/maintenances', data),
  atualizar: (id: number, data: ManutencaoRequest) => api.patch<void>(`/maintenances/${id}`, data),
}
