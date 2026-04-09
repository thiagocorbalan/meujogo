<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users as UsersIcon, Calendar as CalendarIcon, MapPin as MapPinIcon } from 'lucide-vue-next'

const groupsStore = useGroupsStore()
const error = ref<string | null>(null)

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function dayLabel(day: number | null | undefined): string {
  if (day == null || day < 0 || day > 6) return ''
  return DAYS[day]
}

function roleLabel(role: string): string {
  switch (role) {
    case 'DONO': return 'Dono'
    case 'ADMIN': return 'Admin'
    case 'JOGADOR': return 'Jogador'
    default: return role
  }
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'DONO': return 'bg-purple-600 text-white border-transparent hover:bg-purple-600/80'
    case 'ADMIN': return 'bg-blue-600 text-white border-transparent hover:bg-blue-600/80'
    case 'JOGADOR': return 'bg-gray-500 text-white border-transparent hover:bg-gray-500/80'
    default: return ''
  }
}

async function onSelectGroup(group: any) {
  groupsStore.switchGroup(group.id)
  await navigateTo('/')
}

onMounted(async () => {
  try {
    await groupsStore.fetchGroups()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar grupos.'
  }
})
</script>

<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-3xl font-bold text-foreground">Meus Grupos</h1>
      <Button @click="navigateTo('/grupos/criar')">Criar novo grupo</Button>
    </div>

    <div v-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      <p>{{ error }}</p>
    </div>

    <div v-if="groupsStore.loading" class="text-muted-foreground text-base py-10 text-center">
      Carregando grupos...
    </div>

    <div v-else-if="groupsStore.groups.length === 0" class="text-muted-foreground text-base py-10 text-center">
      Nenhum grupo encontrado.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="group in groupsStore.groups"
        :key="group.id"
        class="cursor-pointer transition-shadow hover:shadow-md"
        @click="onSelectGroup(group)"
      >
        <CardHeader>
          <div class="flex items-center justify-between gap-2">
            <CardTitle class="text-lg">{{ group.name }}</CardTitle>
            <Badge :class="roleBadgeClass(group.role)">
              {{ roleLabel(group.role) }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <div v-if="group.memberCount != null" class="flex items-center gap-1.5">
              <UsersIcon class="w-4 h-4" />
              <span>{{ group.memberCount }} {{ group.memberCount === 1 ? 'membro' : 'membros' }}</span>
            </div>
            <div v-if="group.dayOfWeek != null" class="flex items-center gap-1.5">
              <CalendarIcon class="w-4 h-4" />
              <span>{{ dayLabel(group.dayOfWeek) }}<template v-if="group.time"> - {{ group.time }}</template></span>
            </div>
            <div v-if="group.address" class="flex items-center gap-1.5">
              <MapPinIcon class="w-4 h-4" />
              <span>{{ group.address }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
