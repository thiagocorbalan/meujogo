import { useAuthStore } from '~/stores/auth'

type Resource =
  | 'players'
  | 'users'
  | 'seasons'
  | 'settings'
  | 'attendance'
  | 'teams'
  | 'matches'
  | 'sessions'
  | 'champions'

const MODERADOR_RESOURCES: Resource[] = [
  'attendance',
  'teams',
  'matches',
  'sessions',
  'champions',
]

export function usePermissions() {
  const authStore = useAuthStore()

  function canView(resource: Resource): boolean {
    return authStore.isAuthenticated
  }

  function canCreate(resource: Resource): boolean {
    if (!authStore.isAuthenticated) return false
    if (authStore.isAdmin) return true
    if (authStore.isModerador) return MODERADOR_RESOURCES.includes(resource)
    return false
  }

  function canEdit(resource: Resource): boolean {
    if (!authStore.isAuthenticated) return false
    if (authStore.isAdmin) return true
    if (authStore.isModerador) return MODERADOR_RESOURCES.includes(resource)
    return false
  }

  function canDelete(resource: Resource): boolean {
    if (!authStore.isAuthenticated) return false
    if (authStore.isAdmin) return true
    return false
  }

  function canManageMatch(): boolean {
    if (!authStore.isAuthenticated) return false
    return authStore.isAdmin || authStore.isModerador
  }

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManageMatch,
  }
}
