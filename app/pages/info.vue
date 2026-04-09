<template>
  <div class="max-w-[800px] mx-auto p-6">
    <h1 class="text-3xl font-bold text-foreground mb-6">Informações do Grupo</h1>

    <div v-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      <p>{{ error }}</p>
    </div>

    <div v-if="success" class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-700 text-sm mb-4">
      <p>{{ success }}</p>
    </div>

    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">Carregando...</div>

    <template v-else>
      <!-- Local e Horário -->
      <Card class="mb-6">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Local e Horário</CardTitle>
            <BaseButton
              v-if="canEditSettings()"
              variant="secondary"
              size="sm"
              @click="openLocationDialog"
            >
              Editar
            </BaseButton>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-2 text-sm">
            <div>
              <span class="text-muted-foreground">Endereço:</span>
              <span class="ml-2 text-foreground">{{ group?.address || 'Não informado' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Dia:</span>
              <span class="ml-2 text-foreground">{{ dayLabel(group?.dayOfWeek) || 'Não informado' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Horário:</span>
              <span class="ml-2 text-foreground">{{ group?.defaultTime || 'Não informado' }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Regras do Futebol -->
      <Card class="mb-6">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Regras do Futebol</CardTitle>
            <BaseButton
              v-if="canEditSettings()"
              variant="secondary"
              size="sm"
              @click="openRulesDialog"
            >
              Editar
            </BaseButton>
          </div>
        </CardHeader>
        <CardContent>
          <p
            v-if="settings?.rules"
            class="text-sm text-foreground whitespace-pre-line"
          >{{ settings.rules }}</p>
          <p v-else class="text-sm text-muted-foreground italic">Nenhuma regra definida.</p>
        </CardContent>
      </Card>

      <!-- Informações de Pagamento -->
      <Card class="mb-6">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Informações de Pagamento</CardTitle>
            <BaseButton
              v-if="canEditSettings()"
              variant="secondary"
              size="sm"
              @click="openPaymentDialog"
            >
              Editar
            </BaseButton>
          </div>
        </CardHeader>
        <CardContent>
          <p
            v-if="settings?.paymentInfo"
            class="text-sm text-foreground whitespace-pre-line"
          >{{ settings.paymentInfo }}</p>
          <p v-else class="text-sm text-muted-foreground italic">Nenhuma informação de pagamento definida.</p>
        </CardContent>
      </Card>
    </template>

    <!-- Edit Location Dialog -->
    <BaseModal :show="showLocationDialog" title="Editar Local e Horário" @close="closeLocationDialog">
      <form @submit.prevent="onSaveLocation" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <Label>Endereço</Label>
          <Input v-model="locationForm.address" type="text" placeholder="Ex: Quadra da Escola Municipal" />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Dia da Semana</Label>
          <select
            v-model.number="locationForm.dayOfWeek"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option :value="null">Não definido</option>
            <option v-for="(day, i) in DAYS" :key="i" :value="i">{{ day }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <Label>Horário</Label>
          <Input v-model="locationForm.defaultTime" type="text" placeholder="Ex: 19:00" />
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="closeLocationDialog">Cancelar</BaseButton>
        <BaseButton :loading="savingLocation" @click="onSaveLocation">Salvar</BaseButton>
      </template>
    </BaseModal>

    <!-- Edit Rules Dialog -->
    <BaseModal :show="showRulesDialog" title="Editar Regras" @close="closeRulesDialog">
      <form @submit.prevent="onSaveRules" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <Label>Regras do Futebol</Label>
          <textarea
            v-model="rulesForm.rules"
            rows="8"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Escreva as regras do grupo..."
          />
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="closeRulesDialog">Cancelar</BaseButton>
        <BaseButton :loading="savingRules" @click="onSaveRules">Salvar</BaseButton>
      </template>
    </BaseModal>

    <!-- Edit Payment Info Dialog -->
    <BaseModal :show="showPaymentDialog" title="Editar Informações de Pagamento" @close="closePaymentDialog">
      <form @submit.prevent="onSavePayment" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <Label>Informações de Pagamento</Label>
          <textarea
            v-model="paymentForm.paymentInfo"
            rows="6"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="PIX, valor mensal, etc..."
          />
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="closePaymentDialog">Cancelar</BaseButton>
        <BaseButton :loading="savingPayment" @click="onSavePayment">Salvar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const groupsStore = useGroupsStore()
const { getGroup, updateGroup } = useGroups()
const { getSettings, updateSettings } = useSettings()
const { canEdit: canEditPerm } = usePermissions()

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const loading = ref(true)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const group = ref<any>(null)
const settings = ref<any>(null)

const activeGroupId = computed(() => groupsStore.activeGroupId)

function canEditSettings(): boolean {
  return canEditPerm('settings')
}

onMounted(async () => {
  if (!activeGroupId.value) {
    error.value = 'Nenhum grupo selecionado.'
    loading.value = false
    return
  }
  await fetchData()
})

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const [groupData, settingsData] = await Promise.all([
      getGroup(activeGroupId.value!),
      getSettings(),
    ])
    group.value = groupData
    settings.value = settingsData
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar informações do grupo.'
  } finally {
    loading.value = false
  }
}

function dayLabel(day: number | null | undefined): string {
  if (day == null || day < 0 || day > 6) return ''
  return DAYS[day]
}

// Location Dialog
const showLocationDialog = ref(false)
const savingLocation = ref(false)
const locationForm = ref({
  address: '',
  dayOfWeek: null as number | null,
  defaultTime: '',
})

function openLocationDialog() {
  locationForm.value = {
    address: group.value?.address || '',
    dayOfWeek: group.value?.dayOfWeek ?? null,
    defaultTime: group.value?.defaultTime || '',
  }
  showLocationDialog.value = true
}

function closeLocationDialog() {
  showLocationDialog.value = false
}

async function onSaveLocation() {
  if (!activeGroupId.value) return
  savingLocation.value = true
  error.value = null
  try {
    await updateGroup(activeGroupId.value, {
      address: locationForm.value.address || undefined,
      dayOfWeek: locationForm.value.dayOfWeek,
      defaultTime: locationForm.value.defaultTime || undefined,
    })
    closeLocationDialog()
    success.value = 'Local e horário atualizados com sucesso.'
    setTimeout(() => { success.value = null }, 4000)
    await fetchData()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao salvar local e horário.'
  } finally {
    savingLocation.value = false
  }
}

// Rules Dialog
const showRulesDialog = ref(false)
const savingRules = ref(false)
const rulesForm = ref({ rules: '' })

function openRulesDialog() {
  rulesForm.value.rules = settings.value?.rules || ''
  showRulesDialog.value = true
}

function closeRulesDialog() {
  showRulesDialog.value = false
}

async function onSaveRules() {
  savingRules.value = true
  error.value = null
  try {
    await updateSettings({ rules: rulesForm.value.rules })
    closeRulesDialog()
    success.value = 'Regras atualizadas com sucesso.'
    setTimeout(() => { success.value = null }, 4000)
    await fetchData()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao salvar regras.'
  } finally {
    savingRules.value = false
  }
}

// Payment Dialog
const showPaymentDialog = ref(false)
const savingPayment = ref(false)
const paymentForm = ref({ paymentInfo: '' })

function openPaymentDialog() {
  paymentForm.value.paymentInfo = settings.value?.paymentInfo || ''
  showPaymentDialog.value = true
}

function closePaymentDialog() {
  showPaymentDialog.value = false
}

async function onSavePayment() {
  savingPayment.value = true
  error.value = null
  try {
    await updateSettings({ paymentInfo: paymentForm.value.paymentInfo })
    closePaymentDialog()
    success.value = 'Informações de pagamento atualizadas com sucesso.'
    setTimeout(() => { success.value = null }, 4000)
    await fetchData()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao salvar informações de pagamento.'
  } finally {
    savingPayment.value = false
  }
}
</script>
