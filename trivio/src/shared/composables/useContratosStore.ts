import { getApiErrorMessage } from '@/shared/services/api'
import { contratoService, type ContratoAPI } from '@/shared/services/contratoService'
import { createCachedListState } from './createCachedListState'

export const useContratosStore = createCachedListState<ContratoAPI>({
  load: () => contratoService.listar(),
  getErrorMessage: (error) =>
    getApiErrorMessage(error, 'Nao foi possivel carregar os contratos.'),
})
