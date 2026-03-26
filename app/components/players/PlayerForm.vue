<template>
  <BaseModal :show="show" :title="player ? 'Editar Jogador' : 'Novo Jogador'" @close="$emit('close')">
    <form @submit.prevent="onSave" class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <Label>Nome</Label>
        <Input v-model="form.name" type="text" required />
      </div>
      <div class="flex flex-col gap-1">
        <Label>Posição</Label>
        <select v-model="form.position" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <option value="LINHA">Linha</option>
          <option value="GOLEIRO">Goleiro</option>
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <Label>Tipo</Label>
        <select v-model="form.type" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <option value="FIXO">Fixo</option>
          <option value="CONVIDADO">Convidado</option>
          <option value="RESERVA">Reserva</option>
        </select>
      </div>
      <div v-if="player" class="flex flex-col gap-1">
        <Label>Status</Label>
        <select v-model="form.status" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <option value="ATIVO">Ativo</option>
          <option value="LESIONADO">Lesionado</option>
          <option value="AUSENTE">Ausente</option>
        </select>
      </div>
    </form>
    <template #footer>
      <BaseButton variant="secondary" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton @click="onSave">Salvar</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{ player: any | null; show: boolean }>()
const emit = defineEmits<{ save: [data: any]; close: [] }>()

const form = ref({ name: '', position: 'LINHA', type: 'FIXO', status: 'ATIVO' })

watch(() => props.player, (p) => {
  if (p) { form.value = { name: p.name, position: p.position, type: p.type, status: p.status } }
  else { form.value = { name: '', position: 'LINHA', type: 'FIXO', status: 'ATIVO' } }
}, { immediate: true })

function onSave() { emit('save', { ...form.value }) }
</script>
