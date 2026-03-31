
function getCookie(name: string): string | null {
  if (import.meta.server) return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

let csrfToken: string | null = null

async function fetchCsrfToken(baseURL: string): Promise<string | null> {
  const fromCookie = getCookie('csrf-token') || getCookie('XSRF-TOKEN')
  if (fromCookie) {
    csrfToken = fromCookie
    return csrfToken
  }

  try {
    const result = await $fetch<{ token: string }>('/auth/csrf-token', {
      baseURL,
      credentials: 'include',
    })
    csrfToken = result.token
    return csrfToken
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

      if (STATE_CHANGING_METHODS.includes(method)) {
        const token = csrfToken || getCookie('csrf-token') || getCookie('XSRF-TOKEN')
        if (token) {
          headers['X-CSRF-Token'] = token
          csrfToken = token
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
            await $fetch('/auth/refresh', {
              baseURL,
              method: 'POST',
              credentials: 'include',
            })

            return await $fetch<T>(path, {
              baseURL,
              credentials: 'include',
              headers,
              ...opts,
            })
          } catch {
            try {
              const authStore = useAuthStore()
              authStore.clearAuth()
            } catch {
            }
          }
        }
        throw error
      }
    },
  }
}
