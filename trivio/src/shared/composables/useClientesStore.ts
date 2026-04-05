import { getApiErrorMessage } from '@/shared/services/api'
import { clienteService, type ClienteAPI } from '@/shared/services/clienteService'
import { createCachedListState } from './createCachedListState'

export const useClientesStore = createCachedListState<ClienteAPI>({
  load: () => clienteService.listar(),
  getErrorMessage: (error) =>
    getApiErrorMessage(error, 'Nao foi possivel carregar os clientes.'),
})
