import { api } from './api'

export interface ChecklistAPI {
  id: number
  maintenanceId: number
  description: string
  completed: boolean
}

export interface ChecklistRequest {
  maintenanceId: number
  description: string
  completed: boolean
}

export const checklistService = {
  listarPorManutencao: (maintenanceId: number) => {
    const params = new URLSearchParams({ maintenanceId: maintenanceId.toString() })
    return api.get<ChecklistAPI[]>(`/checklists?${params}`)
  },
  criar: (data: ChecklistRequest) => api.postResponse<void>('/checklists', data),
  atualizar: (id: number, data: ChecklistRequest) => api.patch<void>(`/checklists/${id}`, data),
  remover: (id: number) => api.delete<void>(`/checklists/${id}`),
}
