import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlayersStore = defineStore('players', () => {
  const { getPlayers, createPlayer: apiCreate, updatePlayer: apiUpdate, deletePlayer: apiDelete } = usePlayers()
  const players = ref<any[]>([])
  const loading = ref(false)

  async function fetchPlayers() {
    loading.value = true
    try {
      players.value = (await getPlayers()) as any[]
    } finally {
      loading.value = false
    }
  }

  async function createPlayer(data: any) {
    loading.value = true
    try {
      const player = await apiCreate(data)
      players.value.push(player)
      return player
    } finally {
      loading.value = false
    }
  }

  async function updatePlayer(id: string | number, data: any) {
    loading.value = true
    try {
      const updated = await apiUpdate(id, data)
      const index = players.value.findIndex((p) => p.id === id || p.id === Number(id))
      if (index !== -1) players.value[index] = updated
      return updated
    } finally {
      loading.value = false
    }
  }

  async function deletePlayer(id: string | number) {
    loading.value = true
    try {
      await apiDelete(id)
      players.value = players.value.filter((p) => p.id !== id && p.id !== Number(id))
    } finally {
      loading.value = false
    }
  }

  return {
    players,
    loading,
    fetchPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
  }
})
