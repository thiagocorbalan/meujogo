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

/**
 * Resources that group ADMIN role (and DONO) can manage.
 * Maps to the old MODERADOR_RESOURCES but expanded for group context.
 */
const GROUP_ADMIN_RESOURCES: Resource[] = [
  'attendance',
  'teams',
  'matches',
  'sessions',
  'champions',
  'players',
  'settings',
]

/**
 * Get the current group role. Tries the groups store first (if task 5.2 is complete),
 * otherwise returns null. The groups store is auto-imported by @pinia/nuxt when it exists.
 */
function getGroupRole(): string | null {
  try {
    // useGroupsStore is auto-imported by @pinia/nuxt when stores/groups.ts exists
    // If it doesn't exist yet, this throws ReferenceError which we catch
    const groupsStore = useGroupsStore()
    return groupsStore.groupRole ?? null
  } catch {
    // Groups store not available yet — return null
    return null
  }
}

export function usePermissions() {
  const authStore = useAuthStore()

  /**
   * Check if the user is a system-level superadmin.
   * Superadmins bypass all group-level permission checks.
   */
  function isSuperAdmin(): boolean {
    return authStore.isAdmin
  }

  /**
   * Get the effective group role for permission checks.
   * Returns the group role string (DONO, ADMIN, JOGADOR) or null.
   */
  function effectiveGroupRole(): string | null {
    return getGroupRole()
  }

  function isDono(): boolean {
    return effectiveGroupRole() === 'DONO'
  }

  function isGroupAdmin(): boolean {
    const role = effectiveGroupRole()
    return role === 'DONO' || role === 'ADMIN'
  }

  function canView(resource: Resource): boolean {
    return authStore.isAuthenticated
  }

  function canCreate(resource: Resource): boolean {
    if (!authStore.isAuthenticated) return false
    if (isSuperAdmin()) return true
    if (isDono()) return true
    if (isGroupAdmin()) return GROUP_ADMIN_RESOURCES.includes(resource)
    return false
  }

  function canEdit(resource: Resource): boolean {
    if (!authStore.isAuthenticated) return false
    if (isSuperAdmin()) return true
    if (isDono()) return true
    if (isGroupAdmin()) return GROUP_ADMIN_RESOURCES.includes(resource)
    return false
  }

  function canDelete(resource: Resource): boolean {
    if (!authStore.isAuthenticated) return false
    if (isSuperAdmin()) return true
    if (isDono()) return true
    return false
  }

  function canManageMatch(): boolean {
    if (!authStore.isAuthenticated) return false
    if (isSuperAdmin()) return true
    return isGroupAdmin()
  }

  /**
   * Only group DONO (owner) can manage members (invite, remove, change roles).
   */
  function canManageMembers(): boolean {
    if (!authStore.isAuthenticated) return false
    if (isSuperAdmin()) return true
    return isDono()
  }

  /**
   * DONO and ADMIN can confirm attendance for other players.
   * JOGADOR can only confirm for themselves.
   */
  function canConfirmOthers(): boolean {
    if (!authStore.isAuthenticated) return false
    if (isSuperAdmin()) return true
    return isGroupAdmin()
  }

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManageMatch,
    canManageMembers,
    canConfirmOthers,
  }
}
