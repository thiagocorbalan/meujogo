export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server
    ? config.apiBaseUrl
    : config.public.apiBaseUrl

  const authEndpoints = [
    '/auth/login',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
  ]

  return {
    baseURL,
    fetch: async (path: string, opts?: Parameters<typeof $fetch>[1]) => {
      const headers: Record<string, string> = {}

      // Add auth header if not an auth endpoint
      if (!authEndpoints.includes(path)) {
        try {
          const authStore = useAuthStore()
          if (authStore.accessToken) {
            headers['Authorization'] = `Bearer ${authStore.accessToken}`
          }
        } catch {
          // Store might not be initialized (SSR)
        }
      }

      try {
        return await $fetch(path, {
          baseURL,
          headers,
          ...opts,
        })
      } catch (error: any) {
        // Handle 401 - try token refresh
        if (error?.status === 401 && !authEndpoints.includes(path)) {
          try {
            const authStore = useAuthStore()
            if (authStore.refreshToken) {
              const refreshResult: any = await $fetch('/auth/refresh', {
                baseURL,
                method: 'POST',
                body: { refreshToken: authStore.refreshToken },
              })
              authStore.setTokens(
                refreshResult.accessToken,
                authStore.refreshToken,
              )

              // Retry original request with new token
              return await $fetch(path, {
                baseURL,
                headers: {
                  Authorization: `Bearer ${refreshResult.accessToken}`,
                },
                ...opts,
              })
            }
          } catch {
            // Refresh failed - clear auth state
            try {
              const authStore = useAuthStore()
              authStore.clearAuth()
            } catch {
              // Store not available
            }
          }
        }
        throw error
      }
    },
  }
}
