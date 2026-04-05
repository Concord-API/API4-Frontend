import { getApiErrorMessage } from '@/shared/services/api'
import { requisitoService, type RequisitoAPI } from '@/shared/services/requisitoService'
import { createCachedListState } from './createCachedListState'

export const useRequisitosStore = createCachedListState<RequisitoAPI>({
  load: () => requisitoService.listar(),
  getErrorMessage: (error) =>
    getApiErrorMessage(error, 'Nao foi possivel carregar os requisitos.'),
})
