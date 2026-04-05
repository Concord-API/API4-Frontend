import { getApiErrorMessage } from '@/shared/services/api'
import { equipamentoService, type EquipamentoAPI } from '@/shared/services/equipamentoService'
import { createCachedListState } from './createCachedListState'

export const useEquipamentosStore = createCachedListState<EquipamentoAPI>({
  load: () => equipamentoService.listar(),
  getErrorMessage: (error) =>
    getApiErrorMessage(error, 'Nao foi possivel carregar os equipamentos.'),
})
