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
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref('')
  const refreshToken = ref('')
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)
  const userRole = computed(() => user.value?.role ?? null)
  const isAdmin = computed(() => userRole.value === 'ADMIN')
  const isModerador = computed(() => userRole.value === 'MODERADOR')
  const isUsuario = computed(() => userRole.value === 'USUARIO')

  function login(data: LoginResponse) {
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    user.value = data.user

    try {
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch {
      // localStorage may not be available (SSR)
    }
  }

  function logout() {
    clearAuth()

    try {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    } catch {
      // localStorage may not be available (SSR)
    }
  }

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
  }

  function setUser(newUser: AuthUser) {
    user.value = newUser
  }

  function clearAuth() {
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''
  }

  function hydrateFromStorage() {
    try {
      const storedAccess = localStorage.getItem('accessToken')
      const storedRefresh = localStorage.getItem('refreshToken')
      const storedUser = localStorage.getItem('user')

      if (storedAccess) accessToken.value = storedAccess
      if (storedRefresh) refreshToken.value = storedRefresh
      if (storedUser) user.value = JSON.parse(storedUser)
    } catch {
      // localStorage may not be available (SSR) or JSON parse error
    }
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    // Computed
    isAuthenticated,
    userRole,
    isAdmin,
    isModerador,
    isUsuario,
    // Actions
    login,
    logout,
    setTokens,
    setUser,
    clearAuth,
    hydrateFromStorage,
  }
})
