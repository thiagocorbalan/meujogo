const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

let csrfSignature: string | null = null
let refreshPromise: Promise<void> | null = null

async function fetchCsrfToken(baseURL: string): Promise<string | null> {
  try {
    const result = await $fetch<{ csrfToken: string }>('/auth/csrf-token', {
      baseURL,
      credentials: 'include',
    })
    csrfSignature = result.csrfToken
    return csrfSignature
  } catch {
    return null
  }
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server
    ? config.apiBaseUrl
    : config.public.apiBaseUrl

  return {
    baseURL,
    fetch: async <T = any>(path: string, opts?: Parameters<typeof $fetch>[1]): Promise<T> => {
      const headers: Record<string, string> = {}
      const method = ((opts?.method as string) || 'GET').toUpperCase()

      // Inject active group context for group-scoped API endpoints
      if (import.meta.client) {
        try {
          const activeGroupId = localStorage.getItem('activeGroupId')
          if (activeGroupId) {
            headers['X-Group-Id'] = activeGroupId
          }
        } catch {
          // localStorage may be unavailable (e.g. private browsing)
        }
      }

      if (STATE_CHANGING_METHODS.includes(method)) {
        if (!csrfSignature) {
          await fetchCsrfToken(baseURL)
        }
        if (csrfSignature) {
          headers['X-CSRF-Token'] = csrfSignature
        }
      }

      try {
        return await $fetch<T>(path, {
          baseURL,
          credentials: 'include',
          headers,
          ...opts,
        })
      } catch (error: any) {
        if (error?.status === 403 && STATE_CHANGING_METHODS.includes(method)) {
          const newToken = await fetchCsrfToken(baseURL)
          if (newToken) {
            headers['X-CSRF-Token'] = newToken
            return await $fetch<T>(path, {
              baseURL,
              credentials: 'include',
              headers,
              ...opts,
            })
          }
        }

        if (error?.status === 401) {
          try {
            if (!refreshPromise) {
              refreshPromise = $fetch('/auth/refresh', {
                baseURL,
                method: 'POST',
                credentials: 'include',
              }).then(() => {
                refreshPromise = null
              }).catch((refreshError: any) => {
                refreshPromise = null
                throw refreshError
              })
            }
            await refreshPromise

            return await $fetch<T>(path, {
              baseURL,
              credentials: 'include',
              headers,
              ...opts,
            })
          } catch {
            const authStore = useAuthStore()
            authStore.clearAuth()
            if (import.meta.client) {
              const currentPath = window.location.pathname + window.location.search
              if (currentPath !== '/login') {
                await navigateTo(`/login?redirect=${encodeURIComponent(currentPath)}`)
              }
            }
            return undefined as T
          }
        }
        throw error
      }
    },
  }
}
