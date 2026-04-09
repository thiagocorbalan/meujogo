export default defineNuxtRouteMiddleware(async (to, from) => {
  const publicRoutes = [
    '/login',
    '/cadastro',
    '/esqueceu-senha',
    '/redefinir-senha',
    '/auth/callback',
  ]

  const isPublic =
    publicRoutes.includes(to.path) || to.path.startsWith('/convite')

  let authStore: ReturnType<typeof useAuthStore> | null = null
  try {
    authStore = useAuthStore()
  } catch {
    if (!isPublic) {
      return navigateTo('/login')
    }
    return
  }

  if (!authStore.isAuthenticated) {
    await authStore.hydrateFromStorage()
  }

  if (isPublic) {
    if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/cadastro')) {
      return navigateTo('/')
    }
    return
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // Pages that don't require group context
  const groupFreePages = ['/grupos', '/onboarding']
  const isGroupFreePage =
    groupFreePages.includes(to.path) || to.path.startsWith('/grupos/')

  if (isGroupFreePage) {
    return
  }

  // Ensure groups are loaded and activeGroupId is valid
  try {
    const groupsStore = useGroupsStore()

    // Fetch groups if not yet loaded
    if (groupsStore.groups.length === 0) {
      await groupsStore.fetchGroups()
    }

    const groupCount = groupsStore.groups.length

    if (groupCount === 0) {
      return navigateTo('/onboarding')
    }

    // Validate activeGroupId — ensure it matches a real group
    const currentId = groupsStore.activeGroupId
    const isValid =
      currentId && groupsStore.groups.some((g: any) => String(g.id) === String(currentId))

    if (!isValid) {
      if (groupCount === 1) {
        groupsStore.switchGroup(groupsStore.groups[0].id)
      } else {
        return navigateTo('/grupos')
      }
    }
  } catch {
    // Groups store not available — skip group routing
  }
})
