<template>
  <div class="max-w-[800px] mx-auto p-6">
    <h1 class="text-3xl font-bold text-foreground mb-6">Configurações</h1>

    <div v-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      <p>{{ error }}</p>
    </div>

    <div v-if="success" class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-700 text-sm mb-4">
      <p>{{ success }}</p>
    </div>

    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">Carregando...</div>

    <form v-else @submit.prevent="onSave" class="flex flex-col gap-8">
      <!-- Rules -->
      <Card>
        <CardHeader>
          <CardTitle>Regras</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            <div class="flex flex-col gap-1">
              <Label>Máx. Times</Label>
              <Input v-model.number="form.maxTeams" type="number" min="2" />
            </div>
            <div class="flex flex-col gap-1">
              <Label>Jogadores por Time</Label>
              <Input v-model.number="form.playersPerTeam" type="number" min="1" />
            </div>
            <div class="flex flex-col gap-1">
              <Label>Duração da Sessão (min)</Label>
              <Input v-model.number="form.sessionDurationMin" type="number" min="1" />
            </div>
            <div class="flex flex-col gap-1">
              <Label>Duração da Partida (min)</Label>
              <Input v-model.number="form.matchDurationMin" type="number" min="1" />
            </div>
            <div class="flex flex-col gap-1">
              <Label>Máx. Jogos Consecutivos</Label>
              <Input v-model.number="form.maxConsecutiveGames" type="number" min="1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Draw mode -->
      <Card>
        <CardHeader>
          <CardTitle>Sorteio</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-1">
            <Label>Modo de Sorteio Padrão</Label>
            <select v-model="form.drawMode" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="ALEATORIO">Aleatório</option>
              <option value="EQUILIBRADO">Equilibrado (ELO)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <!-- ELO -->
      <Card>
        <CardHeader>
          <CardTitle>ELO</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            <div class="flex flex-col gap-1">
              <Label>ELO Padrão</Label>
              <Input v-model.number="form.defaultElo" type="number" min="0" />
            </div>
            <div class="flex flex-col gap-1">
              <Label>K-Factor</Label>
              <Input v-model.number="form.kFactor" type="number" min="1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Vests -->
      <Card>
        <CardHeader>
          <CardTitle>Coletes</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-2.5 mb-3">
            <div v-for="(vest, i) in form.vests" :key="i" class="flex items-center gap-2.5">
              <Input v-model="vest.name" type="text" placeholder="Nome (ex: Azul)" class="flex-1" />
              <input v-model="vest.color" type="color" class="w-10 h-9 border border-input rounded-md p-0.5 cursor-pointer" />
              <span class="text-xs text-muted-foreground min-w-16">{{ vest.color }}</span>
              <button type="button" class="bg-transparent border-none text-xl text-destructive cursor-pointer px-1 leading-none hover:text-destructive/80" @click="removeVest(i)" title="Remover">&times;</button>
            </div>
          </div>
          <BaseButton type="button" variant="secondary" size="sm" @click="addVest">Adicionar Colete</BaseButton>
        </CardContent>
      </Card>

      <div v-if="canEdit('settings')" class="flex justify-end">
        <BaseButton type="submit" :loading="saving">Salvar Configurações</BaseButton>
      </div>
    </form>

    <!-- Data Management -->
    <Card v-if="canDelete('settings')" class="mt-8">
      <CardHeader>
        <CardTitle>Gerenciamento de Dados</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col gap-3 sm:flex-row">
          <BaseButton variant="danger" @click="showResetModal = true">Resetar Dados</BaseButton>
          <BaseButton variant="secondary" @click="showSeasonModal = true">Encerrar Temporada Atual</BaseButton>
        </div>
      </CardContent>
    </Card>

    <!-- Reset Data Modal -->
    <BaseModal :show="showResetModal" title="Resetar Dados" @close="closeResetModal">
      <div class="text-sm text-muted-foreground">
        <p class="mb-2 font-semibold text-destructive">Atenção: esta ação é irreversível!</p>
        <p>Todos os dados serão apagados permanentemente:</p>
        <ul class="list-disc pl-5 mt-1 mb-2">
          <li>Partidas e eventos</li>
          <li>Temporadas e sessões</li>
          <li>Jogadores e estatísticas</li>
          <li>Times e classificações</li>
          <li>Presenças e campeões</li>
        </ul>
        <p>Apenas <strong>usuários</strong> e <strong>configurações</strong> serão mantidos.</p>
      </div>
      <div v-if="resetError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm mt-3">
        <p>{{ resetError }}</p>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="closeResetModal">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="resetting" @click="onResetData">Confirmar Reset</BaseButton>
      </template>
    </BaseModal>

    <!-- Close Season Modal -->
    <BaseModal :show="showSeasonModal" title="Encerrar Temporada Atual" @close="closeSeasonModal">
      <div class="text-sm text-muted-foreground">
        <p>A temporada atual será encerrada e uma nova temporada será criada automaticamente.</p>
        <p class="mt-2">Os dados da temporada anterior serão preservados.</p>
      </div>
      <div v-if="seasonError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm mt-3">
        <p>{{ seasonError }}</p>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="closeSeasonModal">Cancelar</BaseButton>
        <BaseButton :loading="closingSeason" @click="onCloseSeason">Confirmar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const { canEdit, canDelete } = usePermissions()
const { getSettings, updateSettings, resetData } = useSettings()
const { closeAndRenewSeason } = useSeasons()

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const form = ref({
  maxTeams: 4,
  playersPerTeam: 5,
  sessionDurationMin: 120,
  matchDurationMin: 10,
  maxConsecutiveGames: 2,
  drawMode: 'ALEATORIO',
  defaultElo: 1200,
  kFactor: 32,
  vests: [] as { name: string; color: string }[],
})

onMounted(async () => {
  try {
    const data = await getSettings() as any
    if (data) {
      form.value = {
        maxTeams: data.maxTeams ?? 4,
        playersPerTeam: data.playersPerTeam ?? 5,
        sessionDurationMin: data.sessionDurationMin ?? 120,
        matchDurationMin: data.matchDurationMin ?? 10,
        maxConsecutiveGames: data.maxConsecutiveGames ?? 2,
        drawMode: data.drawMode ?? 'ALEATORIO',
        defaultElo: data.defaultElo ?? 1200,
        kFactor: data.kFactor ?? 32,
        vests: (data.vests ?? []).map((v: any) => ({ name: v.name, color: v.color })),
      }
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar configurações.'
  } finally {
    loading.value = false
  }
})

function addVest() {
  form.value.vests.push({ name: '', color: '#3b82f6' })
}

function removeVest(index: number) {
  form.value.vests.splice(index, 1)
}

async function onSave() {
  saving.value = true
  error.value = null
  success.value = null
  try {
    await updateSettings(form.value)
    success.value = 'Configurações salvas com sucesso.'
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao salvar configurações.'
  } finally {
    saving.value = false
  }
}

// Data Management
const showResetModal = ref(false)
const resetting = ref(false)
const resetError = ref<string | null>(null)

const showSeasonModal = ref(false)
const closingSeason = ref(false)
const seasonError = ref<string | null>(null)

function closeResetModal() {
  showResetModal.value = false
  resetError.value = null
}

function closeSeasonModal() {
  showSeasonModal.value = false
  seasonError.value = null
}

async function onResetData() {
  resetting.value = true
  resetError.value = null
  try {
    await resetData()
    closeResetModal()
    success.value = 'Dados resetados com sucesso.'
  } catch (e: any) {
    resetError.value = e?.data?.message || e?.message || 'Erro ao resetar dados.'
  } finally {
    resetting.value = false
  }
}

async function onCloseSeason() {
  closingSeason.value = true
  seasonError.value = null
  try {
    await closeAndRenewSeason()
    closeSeasonModal()
    success.value = 'Temporada encerrada e nova temporada criada com sucesso.'
  } catch (e: any) {
    seasonError.value = e?.data?.message || e?.message || 'Erro ao encerrar temporada.'
  } finally {
    closingSeason.value = false
  }
}
</script>
