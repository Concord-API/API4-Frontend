import { api } from './api'

export interface EquipamentoAPI {
  id_equipment: number
  name: string
  model: string | null
  manufacturer: string | null
  active: boolean | null
}

export const equipamentoService = {
  listar: () => api.get<EquipamentoAPI[]>('/equipments'),
  buscar: (id: number) => api.get<EquipamentoAPI>(`/equipments/${id}`),
  criar: (data: Omit<EquipamentoAPI, 'id_equipment'>) =>
    api.postResponse<EquipamentoAPI>('/equipments', data),
  atualizar: (id: number, data: Partial<EquipamentoAPI>) => api.patch<EquipamentoAPI>(`/equipments/${id}`, data),
}
