import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const { getSessions, startSession: apiStart, endSession: apiEnd } = useSessions()
  const currentSession = ref<any>(null)
  const sessions = ref<any[]>([])
  const loading = ref(false)

  const isInProgress = computed(() => currentSession.value?.status === 'IN_PROGRESS')
  const isPending = computed(() => currentSession.value?.status === 'PENDING')
  const isFinished = computed(() => currentSession.value?.status === 'FINISHED')

  async function fetchSessions() {
    loading.value = true
    try {
      sessions.value = (await getSessions()) as any[]
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentSession() {
    loading.value = true
    try {
      const result = (await getSessions()) as any[]
      currentSession.value = result?.[0] ?? null
    } finally {
      loading.value = false
    }
  }

  async function startSession(id: string | number) {
    loading.value = true
    try {
      const session = await apiStart(id)
      currentSession.value = session
      return session
    } finally {
      loading.value = false
    }
  }

  async function endSession(sessionId: string | number) {
    loading.value = true
    try {
      const session = await apiEnd(sessionId)
      currentSession.value = session
      return session
    } finally {
      loading.value = false
    }
  }

  return {
    currentSession,
    sessions,
    loading,
    isInProgress,
    isPending,
    isFinished,
    fetchSessions,
    fetchCurrentSession,
    startSession,
    endSession,
  }
})
