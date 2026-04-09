<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft as ArrowLeftIcon } from 'lucide-vue-next'

const groupsStore = useGroupsStore()
const { createGroup } = useGroups()

const error = ref<string | null>(null)
const submitting = ref(false)

const form = ref({
  name: '',
  description: '',
  dayOfWeek: undefined as string | undefined,
  time: '',
  address: '',
})

const days = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda' },
  { value: '2', label: 'Terça' },
  { value: '3', label: 'Quarta' },
  { value: '4', label: 'Quinta' },
  { value: '5', label: 'Sexta' },
  { value: '6', label: 'Sábado' },
]

async function onSubmit() {
  if (!form.value.name.trim()) return

  submitting.value = true
  error.value = null

  try {
    const payload: Record<string, any> = {
      name: form.value.name.trim(),
    }

    if (form.value.description.trim()) {
      payload.description = form.value.description.trim()
    }

    if (form.value.dayOfWeek != null) {
      payload.dayOfWeek = Number(form.value.dayOfWeek)
    }

    if (form.value.time) {
      payload.time = form.value.time
    }

    if (form.value.address.trim()) {
      payload.address = form.value.address.trim()
    }

    const newGroup = (await createGroup(payload)) as any
    groupsStore.switchGroup(newGroup.id)
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao criar grupo.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-[600px] mx-auto p-6">
    <div class="flex items-center gap-3 mb-6">
      <Button variant="ghost" size="sm" @click="navigateTo('/grupos')">
        <ArrowLeftIcon class="w-4 h-4" />
        Voltar
      </Button>
      <h1 class="text-3xl font-bold text-foreground">Criar Grupo</h1>
    </div>

    <div v-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      <p>{{ error }}</p>
    </div>

    <form @submit.prevent="onSubmit">
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-1.5">
              <Label for="nome">Nome do grupo *</Label>
              <Input
                id="nome"
                v-model="form.name"
                placeholder="Ex: Pelada de quinta"
                required
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <Label for="descricao">Descrição</Label>
              <Input
                id="descricao"
                v-model="form.description"
                placeholder="Descrição do grupo (opcional)"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <Label>Dia da semana</Label>
                <Select v-model="form.dayOfWeek">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="day in days"
                      :key="day.value"
                      :value="day.value"
                    >
                      {{ day.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="flex flex-col gap-1.5">
                <Label for="horario">Horário</Label>
                <Input
                  id="horario"
                  v-model="form.time"
                  type="time"
                  placeholder="Ex: 19:00"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <Label for="endereco">Endereço da quadra</Label>
              <Input
                id="endereco"
                v-model="form.address"
                placeholder="Ex: Rua Exemplo, 123 - Bairro"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="flex justify-end mt-6">
        <Button type="submit" :disabled="submitting || !form.name.trim()">
          <template v-if="submitting">Criando...</template>
          <template v-else>Criar grupo</template>
        </Button>
      </div>
    </form>
  </div>
</template>
