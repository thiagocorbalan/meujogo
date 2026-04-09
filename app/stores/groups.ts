import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGroupsStore = defineStore('groups', () => {
  const { getGroups: apiGetGroups, createGroup: apiCreateGroup } = useGroups()

  const groups = ref<any[]>([])
  const activeGroupId = ref<string | null>(null)
  const loading = ref(false)

  // Initialize activeGroupId from localStorage (SSR-safe)
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('activeGroupId')
      if (stored) {
        activeGroupId.value = stored
      }
    } catch {
      // localStorage may be unavailable
    }
  }

  const activeGroup = computed(() =>
    groups.value.find((g) => String(g.id) === String(activeGroupId.value)) ?? null,
  )

  const groupRole = computed(() => activeGroup.value?.role ?? null)

  async function fetchGroups() {
    loading.value = true
    try {
      groups.value = (await apiGetGroups()) as any[]
    } finally {
      loading.value = false
    }
  }

  async function createGroup(data: any) {
    const result = await apiCreateGroup(data)
    groups.value.push(result)
    return result
  }

  function switchGroup(groupId: string | null) {
    activeGroupId.value = groupId
    if (typeof localStorage !== 'undefined') {
      try {
        if (groupId !== null) {
          localStorage.setItem('activeGroupId', groupId)
        } else {
          localStorage.removeItem('activeGroupId')
        }
      } catch {
        // localStorage may be unavailable
      }
    }
  }

  return {
    groups,
    activeGroupId,
    loading,
    activeGroup,
    groupRole,
    fetchGroups,
    createGroup,
    switchGroup,
  }
})
