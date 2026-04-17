interface UseFetchOptions {
  key?: string
  cache?: boolean
  cacheMaxAge?: number
  deduplicate?: boolean
  lazy?: boolean
}

const pendingRequests = new Map<string, Promise<unknown>>()

export function useFetchWithCache<T>(
  url: string | (() => string),
  options: UseFetchOptions = {}
) {
  const { key, cache = true, cacheMaxAge = 300, deduplicate = true } = options

  const requestKey = typeof url === 'function' ? url() : url
  const cacheKey = key || `fetch:${requestKey}`

  const cacheStore = useCache<T>(cacheKey, {
    maxAge: cacheMaxAge,
    storage: 'localStorage'
  })

  const fetchData = async (forceRefresh = false) => {
    if (deduplicate && pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey) as Promise<T>
    }

    if (!forceRefresh && cache) {
      const cachedData = cacheStore.get()
      if (cachedData) {
        if (import.meta.client && cacheStore.isStale()) {
          refreshNuxtData(cacheKey)
        }
        return cachedData
      }
    }

    const requestPromise = $fetch<T>(requestKey, {
      query: cache && !forceRefresh ? { cache: '1' } : { cache: '0' }
    })
      .then((data) => {
        if (cache) {
          cacheStore.set(data)
        }
        if (deduplicate) {
          pendingRequests.delete(requestKey)
        }
        return data
      })
      .catch((error) => {
        if (deduplicate) {
          pendingRequests.delete(requestKey)
        }
        throw error
      })

    if (deduplicate) {
      pendingRequests.set(requestKey, requestPromise)
    }

    return requestPromise
  }

  const refresh = () => fetchData(true)

  const invalidate = () => cacheStore.invalidate()

  const data = ref<T | null>(null) as Ref<T | null>
  const pending = ref(false)
  const error = ref<Error | null>(null)

  return {
    data,
    pending,
    error,
    execute: async (forceRefresh = false) => {
      pending.value = true
      error.value = null
      try {
        const result = await fetchData(forceRefresh)
        data.value = result
        return result
      } catch (e) {
        error.value = e as Error
        throw e
      } finally {
        pending.value = false
      }
    },
    refresh,
    invalidate
  }
}

export function useLazyFetchWithCache<T>(
  url: string | (() => string),
  options: UseFetchOptions = {}
) {
  return useFetchWithCache<T>(url, {
    ...options,
    lazy: true
  })
}
