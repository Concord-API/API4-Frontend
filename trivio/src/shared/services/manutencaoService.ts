import { api } from './api'

export type ManutencaoStatus = 'SCHEDULED' | 'STARTED' | 'COMPLETED'
export type ManutencaoTipo = 'PREVENTIVA' | 'CORRETIVA' | 'MELHORIA'

export interface NextMaintenanceSuggestion {
  contractId: number
  date: string
  type: ManutencaoTipo
  status: ManutencaoStatus
  preventive: boolean
  latitude?: number
  longitude?: number
}

export interface ManutencaoAPI {
  id: number
  active: boolean
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
  nextMaintenanceSuggestion?: NextMaintenanceSuggestion
}

export interface ManutencaoRequest {
  contractId: number
  date: string
  preventive: boolean
  type: ManutencaoTipo
  status: ManutencaoStatus
  employeeIds: number[]
  active?: boolean
  startTime?: string
  endTime?: string
  latitude?: number
  longitude?: number
}

export const manutencaoService = {
  listar: (employeeId?: number) => {
    const params = new URLSearchParams()
    if (employeeId) params.append('employeeId', employeeId.toString())
    return api.get<ManutencaoAPI[]>(`/maintenances${params.toString() ? '?' + params.toString() : ''}`)
  },
  listarPorSemana: (startDate: string, endDate: string, employeeId?: number) => {
    const params = new URLSearchParams({ startDate, endDate })
    if (employeeId) params.append('employeeId', employeeId.toString())
    return api.get<ManutencaoAPI[]>(`/maintenances?${params}`)
  },
  buscar: (id: number) => api.get<ManutencaoAPI>(`/maintenances/${id}`),
  criar: (data: ManutencaoRequest) => api.postResponse<void>('/maintenances', data),
  atualizar: (id: number, data: ManutencaoRequest) => api.patch<ManutencaoAPI>(`/maintenances/${id}`, data),
  gerarProxima: (id: number) => api.post<ManutencaoAPI>(`/maintenances/${id}/next`, {}),
}
