<script setup lang="ts">
import { DialogRoot } from 'reka-ui'
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type PlanFormData = {
  id?: number
  name: string
  priceMonthly: number | string
  priceAnnual: number | string
  maxPlayers: number | string
  maxSessionsPerMonth: number | string
  trialDays: number | string
  trialExpireBehavior: 'CONVERT_TO_FREE' | 'BLOCK'
  stripePriceIdMonthly: string
  stripePriceIdAnnual: string
  features: string
}

const props = defineProps<{
  show: boolean
  initial?: Partial<PlanFormData>
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { createPlan, updatePlan } = useAdminApi()

const isEdit = computed(() => !!props.initial?.id)

const form = ref<PlanFormData>({
  name: '',
  priceMonthly: '',
  priceAnnual: '',
  maxPlayers: '',
  maxSessionsPerMonth: '',
  trialDays: 0,
  trialExpireBehavior: 'CONVERT_TO_FREE',
  stripePriceIdMonthly: '',
  stripePriceIdAnnual: '',
  features: '',
})

watch(
  () => props.show,
  (val) => {
    if (val) {
      form.value = {
        name: props.initial?.name ?? '',
        priceMonthly: props.initial?.priceMonthly ?? '',
        priceAnnual: props.initial?.priceAnnual ?? '',
        maxPlayers: props.initial?.maxPlayers ?? '',
        maxSessionsPerMonth: props.initial?.maxSessionsPerMonth ?? '',
        trialDays: props.initial?.trialDays ?? 0,
        trialExpireBehavior: props.initial?.trialExpireBehavior ?? 'CONVERT_TO_FREE',
        stripePriceIdMonthly: props.initial?.stripePriceIdMonthly ?? '',
        stripePriceIdAnnual: props.initial?.stripePriceIdAnnual ?? '',
        features: props.initial?.features ?? '',
      }
      errors.value = {}
    }
  },
)

const saving = ref(false)
const errors = ref<Record<string, string>>({})
const serverError = ref<string | null>(null)

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.value.name.trim()) e.name = 'Nome é obrigatório.'
  if (form.value.priceMonthly === '' || Number(form.value.priceMonthly) < 0) e.priceMonthly = 'Informe o preço mensal.'
  if (form.value.priceAnnual === '' || Number(form.value.priceAnnual) < 0) e.priceAnnual = 'Informe o preço anual.'
  if (form.value.maxPlayers === '' || Number(form.value.maxPlayers) < 1) e.maxPlayers = 'Informe o máximo de jogadores.'
  if (form.value.maxSessionsPerMonth === '' || Number(form.value.maxSessionsPerMonth) < 1) e.maxSessionsPerMonth = 'Informe o máximo de sessões por mês.'
  errors.value = e
  return Object.keys(e).length === 0
}

function parseFeatures(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function onSubmit() {
  serverError.value = null
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      priceMonthly: Number(form.value.priceMonthly),
      priceAnnual: Number(form.value.priceAnnual),
      maxPlayers: Number(form.value.maxPlayers),
      maxSessionsPerMonth: Number(form.value.maxSessionsPerMonth),
      trialDays: Number(form.value.trialDays),
      trialExpireBehavior: form.value.trialExpireBehavior,
      stripePriceIdMonthly: form.value.stripePriceIdMonthly.trim() || undefined,
      stripePriceIdAnnual: form.value.stripePriceIdAnnual.trim() || undefined,
      features: parseFeatures(form.value.features),
    }
    if (isEdit.value && props.initial?.id) {
      await updatePlan(props.initial.id, payload)
    } else {
      await createPlan(payload)
    }
    emit('saved')
  } catch (e: any) {
    serverError.value = e?.data?.message || e?.message || 'Erro ao salvar plano.'
  } finally {
    saving.value = false
  }
}

function onOpenChange(val: boolean) {
  if (!val) emit('close')
}
</script>

<template>
  <DialogRoot :open="show" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Editar Plano' : 'Criar Plano' }}</DialogTitle>
      </DialogHeader>

      <form id="plan-form" class="grid gap-4 py-2" @submit.prevent="onSubmit">
        <!-- Server error -->
        <div
          v-if="serverError"
          role="alert"
          class="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ serverError }}
        </div>

        <!-- Name -->
        <div class="flex flex-col gap-1">
          <Label for="plan-name">Nome</Label>
          <Input
            id="plan-name"
            v-model="form.name"
            type="text"
            placeholder="Ex: Pro"
            :aria-describedby="errors.name ? 'plan-name-error' : undefined"
            :aria-invalid="!!errors.name"
          />
          <p v-if="errors.name" id="plan-name-error" class="text-xs text-destructive" role="alert">
            {{ errors.name }}
          </p>
        </div>

        <!-- Prices -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <Label for="plan-price-monthly">Preço Mensal (R$)</Label>
            <Input
              id="plan-price-monthly"
              v-model="form.priceMonthly"
              type="number"
              min="0"
              step="0.01"
              placeholder="29.90"
              :aria-describedby="errors.priceMonthly ? 'plan-price-monthly-error' : undefined"
              :aria-invalid="!!errors.priceMonthly"
            />
            <p v-if="errors.priceMonthly" id="plan-price-monthly-error" class="text-xs text-destructive" role="alert">
              {{ errors.priceMonthly }}
            </p>
          </div>
          <div class="flex flex-col gap-1">
            <Label for="plan-price-annual">Preço Anual (R$)</Label>
            <Input
              id="plan-price-annual"
              v-model="form.priceAnnual"
              type="number"
              min="0"
              step="0.01"
              placeholder="290.00"
              :aria-describedby="errors.priceAnnual ? 'plan-price-annual-error' : undefined"
              :aria-invalid="!!errors.priceAnnual"
            />
            <p v-if="errors.priceAnnual" id="plan-price-annual-error" class="text-xs text-destructive" role="alert">
              {{ errors.priceAnnual }}
            </p>
          </div>
        </div>

        <!-- Limits -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <Label for="plan-max-players">Máx. Jogadores</Label>
            <Input
              id="plan-max-players"
              v-model="form.maxPlayers"
              type="number"
              min="1"
              placeholder="30"
              :aria-describedby="errors.maxPlayers ? 'plan-max-players-error' : undefined"
              :aria-invalid="!!errors.maxPlayers"
            />
            <p v-if="errors.maxPlayers" id="plan-max-players-error" class="text-xs text-destructive" role="alert">
              {{ errors.maxPlayers }}
            </p>
          </div>
          <div class="flex flex-col gap-1">
            <Label for="plan-max-sessions">Máx. Sessões/Mês</Label>
            <Input
              id="plan-max-sessions"
              v-model="form.maxSessionsPerMonth"
              type="number"
              min="1"
              placeholder="8"
              :aria-describedby="errors.maxSessionsPerMonth ? 'plan-max-sessions-error' : undefined"
              :aria-invalid="!!errors.maxSessionsPerMonth"
            />
            <p v-if="errors.maxSessionsPerMonth" id="plan-max-sessions-error" class="text-xs text-destructive" role="alert">
              {{ errors.maxSessionsPerMonth }}
            </p>
          </div>
        </div>

        <!-- Trial -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <Label for="plan-trial-days">Dias de Trial</Label>
            <Input
              id="plan-trial-days"
              v-model="form.trialDays"
              type="number"
              min="0"
              placeholder="14"
            />
          </div>
          <div class="flex flex-col gap-1">
            <Label for="plan-trial-expire">Ao Expirar Trial</Label>
            <select
              id="plan-trial-expire"
              v-model="form.trialExpireBehavior"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="CONVERT_TO_FREE">Converter para Free</option>
              <option value="BLOCK">Bloquear acesso</option>
            </select>
          </div>
        </div>

        <!-- Stripe Price IDs -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <Label for="plan-stripe-monthly">Stripe Price ID Mensal</Label>
            <Input
              id="plan-stripe-monthly"
              v-model="form.stripePriceIdMonthly"
              type="text"
              placeholder="price_XXXXXXXXXX"
              aria-describedby="plan-stripe-monthly-hint"
            />
            <p id="plan-stripe-monthly-hint" class="text-xs text-muted-foreground">
              Formato: price_XXXXXXXXXX
            </p>
          </div>
          <div class="flex flex-col gap-1">
            <Label for="plan-stripe-annual">Stripe Price ID Anual</Label>
            <Input
              id="plan-stripe-annual"
              v-model="form.stripePriceIdAnnual"
              type="text"
              placeholder="price_XXXXXXXXXX"
              aria-describedby="plan-stripe-annual-hint"
            />
            <p id="plan-stripe-annual-hint" class="text-xs text-muted-foreground">
              Formato: price_XXXXXXXXXX
            </p>
          </div>
        </div>

        <!-- Features -->
        <div class="flex flex-col gap-1">
          <Label for="plan-features">Funcionalidades</Label>
          <textarea
            id="plan-features"
            v-model="form.features"
            rows="3"
            placeholder="Sorteio equilibrado, Estatísticas avançadas, Suporte prioritário"
            aria-describedby="plan-features-hint"
            class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <p id="plan-features-hint" class="text-xs text-muted-foreground">
            Separe cada funcionalidade com vírgula.
          </p>
        </div>
      </form>

      <DialogFooter>
        <BaseButton variant="secondary" type="button" @click="emit('close')">Cancelar</BaseButton>
        <BaseButton type="submit" form="plan-form" :loading="saving">
          {{ isEdit ? 'Salvar Alterações' : 'Criar Plano' }}
        </BaseButton>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>
</template>
