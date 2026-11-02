<script setup lang="ts">
import { Badge } from '@/components/ui/badge'

definePageMeta({ layout: 'admin' })

const adminApi = useAdminApi()

// ── State ─────────────────────────────────────────────────────────────────

const history = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const selectedDoc = ref<any>(null)
const editorContent = ref('')
const versionInput = ref('')

const saving = ref(false)
const publishing = ref(false)
const showPublishConfirm = ref(false)
const showNewDraftConfirm = ref(false)
const newDraftVersion = ref('')

// ── Load history ──────────────────────────────────────────────────────────

async function loadHistory() {
  loading.value = true
  error.value = null
  try {
    const data = await adminApi.getLegalHistory('PRIVACY')
    history.value = Array.isArray(data) ? data : (data?.items ?? [])
    if (history.value.length > 0 && !selectedDoc.value) {
      selectDoc(history.value[0])
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar histórico.'
  } finally {
    loading.value = false
  }
}

onMounted(loadHistory)

// ── Doc selection ─────────────────────────────────────────────────────────

function selectDoc(doc: any) {
  selectedDoc.value = doc
  editorContent.value = doc.content ?? ''
  versionInput.value = doc.version ?? ''
}

// ── Create new draft ──────────────────────────────────────────────────────

async function createDraft() {
  const version = newDraftVersion.value.trim()
  if (!version) {
    error.value = 'Informe a versão do novo rascunho.'
    return
  }
  showNewDraftConfirm.value = false
  saving.value = true
  error.value = null
  try {
    const created = await adminApi.createLegalDoc('PRIVACY', {
      content: '<p></p>',
      version,
    })
    newDraftVersion.value = ''
    history.value.unshift(created)
    selectDoc(created)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao criar rascunho.'
  } finally {
    saving.value = false
  }
}

// ── Save draft ────────────────────────────────────────────────────────────

async function saveDraft() {
  if (!selectedDoc.value) return
  if (!versionInput.value.trim()) {
    error.value = 'O campo versão é obrigatório.'
    return
  }
  saving.value = true
  error.value = null
  try {
    const updated = await adminApi.updateLegalDoc('PRIVACY', selectedDoc.value.id, {
      content: editorContent.value,
      version: versionInput.value.trim(),
    })
    const idx = history.value.findIndex((d) => d.id === selectedDoc.value.id)
    if (idx !== -1) history.value[idx] = updated
    selectedDoc.value = updated
    versionInput.value = updated.version ?? versionInput.value
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao salvar.'
  } finally {
    saving.value = false
  }
}

// ── Publish ───────────────────────────────────────────────────────────────

async function publishDoc() {
  showPublishConfirm.value = false
  if (!selectedDoc.value) return
  publishing.value = true
  error.value = null
  try {
    const updated = await adminApi.publishLegalDoc('PRIVACY', selectedDoc.value.id)
    // Mark all others as INACTIVE locally, then update the published one
    history.value.forEach((d) => {
      if (d.id !== updated.id && d.status === 'PUBLISHED') d.status = 'INACTIVE'
    })
    const idx = history.value.findIndex((d) => d.id === updated.id)
    if (idx !== -1) history.value[idx] = updated
    selectedDoc.value = updated
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao publicar.'
  } finally {
    publishing.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

const isDraft = computed(() => selectedDoc.value?.status === 'DRAFT')

function statusVariant(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'secondary',
    PUBLISHED: 'default',
    ARCHIVED: 'outline',
  }
  return (map[status] ?? 'outline') as any
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Rascunho',
    PUBLISHED: 'Publicado',
    ARCHIVED: 'Arquivado',
  }
  return map[status] ?? status
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Política de Privacidade</h1>
        <p class="text-sm text-muted-foreground mt-1">Gerencie as versões da Política de Privacidade da plataforma.</p>
      </div>
      <BaseButton :loading="saving" @click="showNewDraftConfirm = true">
        Nova Versao
      </BaseButton>
    </div>

    <div v-if="error" role="alert" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      {{ error }}
    </div>

    <div v-if="loading" class="text-muted-foreground text-sm py-10 text-center">Carregando...</div>

    <div v-else class="flex gap-6 items-start">
      <!-- Sidebar: version history -->
      <aside class="w-56 shrink-0 flex flex-col gap-1" aria-label="Histórico de versões">
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Versões
        </p>
        <div v-if="history.length === 0" class="text-sm text-muted-foreground px-1">
          Nenhuma versão cadastrada.
        </div>
        <button
          v-for="doc in history"
          :key="doc.id"
          type="button"
          :aria-current="selectedDoc?.id === doc.id ? 'true' : undefined"
          :class="[
            'w-full text-left px-3 py-2.5 rounded-md border text-sm transition-colors',
            selectedDoc?.id === doc.id
              ? 'bg-primary/10 border-primary/30 font-medium'
              : 'bg-background hover:bg-muted border-transparent',
          ]"
          @click="selectDoc(doc)"
        >
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="font-medium truncate">{{ doc.version || '(sem versão)' }}</span>
            <Badge :variant="statusVariant(doc.status)" class="shrink-0 text-xs">
              {{ statusLabel(doc.status) }}
            </Badge>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5">{{ formatDate(doc.updatedAt ?? doc.createdAt) }}</p>
        </button>
      </aside>

      <!-- Main content area -->
      <div class="flex-1 min-w-0">
        <div v-if="!selectedDoc" class="text-muted-foreground text-sm py-10 text-center">
          Selecione uma versão na lateral ou crie uma nova.
        </div>

        <template v-else>
          <!-- Draft: editable -->
          <template v-if="isDraft">
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-4 flex-wrap">
                <div class="flex flex-col gap-1 flex-1 min-w-[140px] max-w-[260px]">
                  <label for="version-input" class="text-sm font-medium">Versão <span class="text-destructive">*</span></label>
                  <input
                    id="version-input"
                    v-model="versionInput"
                    type="text"
                    placeholder="ex: 1.0.0"
                    required
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 placeholder:text-muted-foreground"
                  >
                </div>
                <div class="flex items-end gap-2 pt-5">
                  <BaseButton :loading="saving" @click="saveDraft">Salvar</BaseButton>
                  <BaseButton variant="secondary" :disabled="publishing" @click="showPublishConfirm = true">
                    Publicar
                  </BaseButton>
                </div>
              </div>

              <AdminRichTextEditor v-model="editorContent" />
            </div>
          </template>

          <!-- Published/Archived: readonly -->
          <template v-else>
            <div class="flex items-center gap-3 mb-4 flex-wrap">
              <h2 class="text-lg font-semibold">
                Versão {{ selectedDoc.version || '—' }}
              </h2>
              <Badge :variant="statusVariant(selectedDoc.status)">
                {{ statusLabel(selectedDoc.status) }}
              </Badge>
              <span class="text-sm text-muted-foreground">
                {{ formatDate(selectedDoc.updatedAt ?? selectedDoc.createdAt) }}
              </span>
            </div>
            <!-- Rendered HTML (readonly) -->
            <div
              class="prose prose-sm max-w-none p-4 border rounded-md bg-background min-h-[200px]"
              v-html="selectedDoc.content"
            />
          </template>
        </template>
      </div>
    </div>

    <!-- Publish confirmation modal -->
    <BaseModal :show="showPublishConfirm" title="Publicar Política de Privacidade" @close="showPublishConfirm = false">
      <p class="text-sm text-muted-foreground">
        Tem certeza que deseja publicar a versão
        <strong>{{ versionInput || selectedDoc?.version }}</strong>?
        Esta ação tornará a política visível para todos os usuários e arquivará a versão anterior.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="showPublishConfirm = false">Cancelar</BaseButton>
        <BaseButton :loading="publishing" @click="publishDoc">Publicar</BaseButton>
      </template>
    </BaseModal>

    <!-- New draft confirmation modal -->
    <BaseModal :show="showNewDraftConfirm" title="Nova Versao" @close="showNewDraftConfirm = false; newDraftVersion = ''">
      <p class="text-sm text-muted-foreground mb-3">
        Informe a versão do novo rascunho da Política de Privacidade.
      </p>
      <div class="flex flex-col gap-1">
        <label for="new-draft-version" class="text-sm font-medium">Versão <span class="text-destructive">*</span></label>
        <input
          id="new-draft-version"
          v-model="newDraftVersion"
          type="text"
          placeholder="ex: 1.0.0"
          required
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 placeholder:text-muted-foreground"
        >
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showNewDraftConfirm = false; newDraftVersion = ''">Cancelar</BaseButton>
        <BaseButton :loading="saving" :disabled="!newDraftVersion.trim()" @click="createDraft">Criar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
