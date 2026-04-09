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

    <form v-else class="flex flex-col gap-8" @submit.prevent="onSave">  
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
<Card>
        <CardHeader>
          <CardTitle>Configurações ELO</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-3"
            role="alert"
          >
            <p class="text-sm text-blue-700 leading-relaxed">
              <strong>ELO</strong> é um sistema de pontuação que mede o desempenho dos jogadores ao longo das partidas. Jogadores ganham pontos quando vencem e perdem pontos quando perdem. Quanto maior o adversário, mais pontos você ganha ao vencer.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ELO Padrão</Label>
              <Input v-model.number="form.defaultElo" type="number" min="0" class="h-11 text-base mt-1" />
            </div>
            <div>
              <Label>K-Factor</Label>
              <Input v-model.number="form.kFactor" type="number" min="1" class="h-11 text-base mt-1" />
            </div>
          </div>
          <p className="text-sm text-gray-400">Fator K maior = variação de rating mais rápida. Padrão: 32.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Coletes</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-gray-500">Configure {{ form.maxTeams || 3 }} cores (uma por time). Clique na cor para abrir o seletor.</p>
          <div class="space-y-3 my-3">
            <div
              v-for="(vest, i) in form.vests"
              :key="i"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
            >
              <span class="text-sm font-bold text-gray-400 w-6">{{ i + 1 }}</span>
              <label class="relative cursor-pointer">
                <div
                  class="w-10 h-10 rounded-full border-4 border-white shadow-md cursor-pointer"
                  :style="{ backgroundColor: vest.color }"
                />
                <input
                  v-model="vest.color"
                  type="color"
                  class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                >
              </label>
              <Input
                v-model="vest.name"
                :placeholder="`Nome do time ${i + 1}`"
                class="h-9 text-sm flex-1"
              />
              <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: vest.color }" />
              <button
                type="button"
                class="bg-transparent border-none text-xl text-destructive cursor-pointer px-1 leading-none hover:text-destructive/80"
                title="Remover"
                @click="removeVest(i)"
              >
                &times;
              </button>
            </div>
          </div>
          <BaseButton type="button" variant="secondary" size="sm" @click="addVest">Adicionar Colete</BaseButton>
        </CardContent>
      </Card>

      <div v-if="canEdit('settings')" class="flex justify-end">
        <BaseButton type="submit" :loading="saving">Salvar Configurações</BaseButton>
      </div>
    </form>
    <template v-if="canDelete('settings')">
      <Card v-if="canDelete('settings')" class="mt-8">
        <CardHeader>
          <CardTitle>Temporada</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex flex-col gap-3 sm:flex-row">
            <BaseButton variant="secondary" class="w-full h-11 text-base border-amber-300 text-amber-700 hover:bg-amber-50" @click="showSeasonModal = true">🏁 Encerrar Temporada Atual</BaseButton>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Histórico de Temporadas</h3>
            <div class="space-y-2">
              <div key={s.id} class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                      <p class="text-base font-semibold">2014</p>
                      <p class="text-sm text-gray-400">
                        06/04/2026 · 34 gols · 20 jogadores
                      </p>
                    </div>
                    <span class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Encerrada</span>
                  </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card v-if="canDelete('settings')" class="mt-8 border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle class="text-base flex items-center gap-2 text-red-700">
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent class="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-medium text-red-800">Resetar todos os dados</p>
              <p className="text-sm text-red-600 mt-1">Apaga permanentemente jogadores, partidas e histórico. Irreversível.</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
              <BaseButton variant="danger" @click="showResetModal = true">Resetar Dados</BaseButton>
            </div>
          </CardContent>
        </Card>
    </template>
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
