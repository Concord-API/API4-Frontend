import { api } from './api'

export interface RequisitoAPI {
  id: number
  name: string
  description: string | null
  active: boolean
}

export interface RequisitoRequest {
  name: string
  description?: string | null
  active?: boolean
}

export const requisitoService = {
  listar: () => api.get<RequisitoAPI[]>('/requirements'),
  buscar: (id: number) => api.get<RequisitoAPI>(`/requirements/${id}`),
  criar: (data: RequisitoRequest) => api.postResponse<RequisitoAPI>('/requirements', data),
  atualizar: (id: number, data: Partial<RequisitoRequest>) =>
    api.patch<RequisitoAPI>(`/requirements/${id}`, data),
}
