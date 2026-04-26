import { api } from './api'

export interface TecnicoAPI {
  employeeId: number
  name: string
  email: string
  admin: boolean
  active: boolean
  password?: string
}

export const tecnicoService = {
  listar: () => api.get<TecnicoAPI[]>('/employees'),
  buscar: (id: number) => api.get<TecnicoAPI>(`/employees/${id}`),
  criar: (data: Omit<TecnicoAPI, 'employeeId'>) =>
    api.postResponse<TecnicoAPI>('/employees', data),
  atualizar: (id: number, data: Omit<TecnicoAPI, 'employeeId'>) =>
    api.patch<TecnicoAPI>(`/employees/${id}`, data),
}
