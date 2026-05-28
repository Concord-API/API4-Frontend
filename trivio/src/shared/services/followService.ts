import { api } from './api'

export interface FollowAPI {
  id: number
  maintenanceId: number
  employeeId: number
  employeeName: string
  message: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface FollowCreateRequest {
  maintenanceId: number
  message: string
}

export interface FollowUpdateRequest {
  id: number
  message: string
  active: boolean
}

export const followService = {
  listarPorManutencao: (maintenanceId: number) => {
    const params = new URLSearchParams({ maintenanceId: maintenanceId.toString() })
    return api.get<FollowAPI[]>(`/follows?${params}`)
  },
  criar: (data: FollowCreateRequest) => api.post<FollowAPI>('/follows', data),
  atualizar: (data: FollowUpdateRequest) => api.patch<void>('/follows', data),
}
