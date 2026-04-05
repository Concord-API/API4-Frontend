import { createGlobalState } from '@vueuse/core'
import { computed, shallowRef } from 'vue'

interface CreateCachedListStateOptions<TItem> {
  load: () => Promise<TItem[]>
  getErrorMessage: (error: unknown) => string
}

export function createCachedListState<TItem>({
  load,
  getErrorMessage,
}: CreateCachedListStateOptions<TItem>) {
  return createGlobalState(() => {
    const items = shallowRef<TItem[]>([])
    const loading = shallowRef(false)
    const loaded = shallowRef(false)
    const error = shallowRef<string | null>(null)

    let currentRequest: Promise<TItem[]> | null = null

    async function runLoad(force = false): Promise<TItem[]> {
      if (!force && loaded.value) {
        return items.value
      }

      if (currentRequest) {
        return currentRequest
      }

      loading.value = true
      error.value = null

      currentRequest = load()
        .then((nextItems) => {
          items.value = nextItems
          loaded.value = true
          return nextItems
        })
        .catch((nextError: unknown) => {
          error.value = getErrorMessage(nextError)
          throw nextError
        })
        .finally(() => {
          loading.value = false
          currentRequest = null
        })

      return currentRequest
    }

    function invalidate() {
      loaded.value = false
    }

    return {
      items: computed(() => items.value),
      loading: computed(() => loading.value),
      loaded: computed(() => loaded.value),
      error: computed(() => error.value),
      ensureLoaded: () => runLoad(false),
      refresh: () => runLoad(true),
      invalidate,
    }
  })
}
