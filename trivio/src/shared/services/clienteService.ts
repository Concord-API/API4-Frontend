import { api } from './api'

export interface ClienteAPI {
  id_client: number
  name: string
  cpf: string | null
  cnpj: string | null
  email: string | null
  phone: string | null
  active: boolean | null
}

export const clienteService = {
  listar: () => api.get<ClienteAPI[]>('/clients'),
  buscar: (id: number) => api.get<ClienteAPI>(`/clients/${id}`),
  criar: (data: Omit<ClienteAPI, 'id_client'>) => api.postResponse<void>('/clients', data),
  atualizar: (id: number, data: Partial<ClienteAPI>) => api.patch<void>(`/clients/${id}`, data),
}
