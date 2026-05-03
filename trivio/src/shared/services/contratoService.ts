import { api } from './api'
import type { ClienteAPI } from './clienteService'
import type { EquipamentoAPI } from './equipamentoService'
import type { RequisitoAPI } from './requisitoService'

export interface ContratoAPI {
  id: number
  client: ClienteAPI
  initialDate: string
  finalDate: string
  recurrenceMaintenance: number
  active: boolean
  equipments: EquipamentoAPI[]
  requirements: RequisitoAPI[]
  latitude: number
  longitude: number
}

export interface ContratoRequest {
  clientId: number
  initialDate: string
  finalDate: string
  recurrenceMaintenance: number
  active: boolean
  equipmentIds: number[]
  requirementIds: number[]
  latitude: number
  longitude: number
}

export const contratoService = {
  listar: () => api.get<ContratoAPI[]>('/contracts'),
  buscar: (id: number) => api.get<ContratoAPI>(`/contracts/${id}`),
  criar: (data: ContratoRequest) => api.postResponse<void>('/contracts', data),
  atualizar: (id: number, data: ContratoRequest) => api.patch<void>(`/contracts/${id}`, data),
}
