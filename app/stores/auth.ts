import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AuthUser {
  id: number | string
  name: string
  email: string
  role: string
  [key: string]: any
}

export interface LoginResponse {
  user: AuthUser
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role ?? null)
  const isAdmin = computed(() => userRole.value === 'ADMIN')
  const isModerador = computed(() => userRole.value === 'MODERADOR')
  const isUsuario = computed(() => userRole.value === 'USUARIO')

  function login(data: LoginResponse) {
    user.value = data.user

    try {
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch {
    }
  }

  async function logout() {
    try {
      const { fetch: apiFetch } = useApi()
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // Even if the API call fails, clear local state
    }

    clearAuth()

    try {
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } catch {
    }
  }

  function setUser(newUser: AuthUser) {
    user.value = newUser
    try {
      localStorage.setItem('user', JSON.stringify(newUser))
    } catch {
    }
  }

  function clearAuth() {
    user.value = null
    try {
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } catch {
      // localStorage may be unavailable
    }
  }

  
  async function hydrateFromStorage() {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) user.value = JSON.parse(storedUser)

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } catch {
    }

    try {
      const config = useRuntimeConfig()
      const baseURL = import.meta.server
        ? config.apiBaseUrl
        : config.public.apiBaseUrl

      const me = await $fetch<AuthUser>('/auth/me', {
        baseURL,
        credentials: 'include',
      })
      if (me) {
        user.value = me
        try {
          localStorage.setItem('user', JSON.stringify(me))
        } catch {
        }
      }
    } catch {
      user.value = null
      try {
        localStorage.removeItem('user')
      } catch {
      }
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    userRole,
    isAdmin,
    isModerador,
    isUsuario,
    login,
    logout,
    setUser,
    clearAuth,
    hydrateFromStorage,
  }
})
