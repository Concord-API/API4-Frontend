import { getApiErrorMessage } from '@/shared/services/api'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { createCachedListState } from './createCachedListState'

export const useTecnicosStore = createCachedListState<TecnicoAPI>({
  load: () => tecnicoService.listar(),
  getErrorMessage: (error) =>
    getApiErrorMessage(error, 'Nao foi possivel carregar os colaboradores.'),
})
