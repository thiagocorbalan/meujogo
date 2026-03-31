export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = [
    '/login',
    '/esqueceu-senha',
    '/redefinir-senha',
    '/auth/callback',
  ]

  const isPublic = publicRoutes.includes(to.path)

  let authStore: ReturnType<typeof useAuthStore> | null = null
  try {
    authStore = useAuthStore()
  } catch {
    // Store might not be initialized yet (SSR cold start)
    if (!isPublic) {
      return navigateTo('/login')
    }
    return
  }

  if (!authStore.isAuthenticated) {
    authStore.hydrateFromStorage()
  }

  if (isPublic) {
    if (authStore.isAuthenticated && to.path === '/login') {
      return navigateTo('/')
    }
    return
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
