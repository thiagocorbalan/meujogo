<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = withDefaults(defineProps<{
  modelValue: string
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue,
  editable: !props.disabled,
  extensions: [StarterKit],
  onUpdate({ editor: e }) {
    emit('update:modelValue', e.getHTML())
  },
})

// Sync external value changes (e.g. when parent loads new content)
watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  const current = editor.value.getHTML()
  if (val !== current) {
    editor.value.commands.setContent(val, false)
  }
})

// Sync disabled state
watch(() => props.disabled, (val) => {
  editor.value?.setEditable(!val)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="flex flex-col border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
    <!-- Toolbar -->
    <div
      role="toolbar"
      aria-label="Formatacao de texto"
      class="flex flex-wrap gap-1 p-2 border-b bg-muted/40"
    >
      <button
        type="button"
        title="Negrito"
        :aria-pressed="editor?.isActive('bold') ?? false"
        :disabled="disabled"
        :class="[
          'px-2 py-1 rounded text-sm font-bold transition-colors',
          editor?.isActive('bold')
            ? 'bg-primary text-primary-foreground'
            : 'bg-background hover:bg-muted border',
          disabled && 'opacity-50 cursor-not-allowed',
        ]"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        B
      </button>

      <button
        type="button"
        title="Itálico"
        :aria-pressed="editor?.isActive('italic') ?? false"
        :disabled="disabled"
        :class="[
          'px-2 py-1 rounded text-sm italic transition-colors',
          editor?.isActive('italic')
            ? 'bg-primary text-primary-foreground'
            : 'bg-background hover:bg-muted border',
          disabled && 'opacity-50 cursor-not-allowed',
        ]"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        I
      </button>

      <div class="w-px h-6 bg-border self-center mx-1" aria-hidden="true" />

      <button
        type="button"
        title="Título 1"
        :aria-pressed="editor?.isActive('heading', { level: 1 }) ?? false"
        :disabled="disabled"
        :class="[
          'px-2 py-1 rounded text-sm font-semibold transition-colors',
          editor?.isActive('heading', { level: 1 })
            ? 'bg-primary text-primary-foreground'
            : 'bg-background hover:bg-muted border',
          disabled && 'opacity-50 cursor-not-allowed',
        ]"
        @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        H1
      </button>

      <button
        type="button"
        title="Título 2"
        :aria-pressed="editor?.isActive('heading', { level: 2 }) ?? false"
        :disabled="disabled"
        :class="[
          'px-2 py-1 rounded text-sm font-semibold transition-colors',
          editor?.isActive('heading', { level: 2 })
            ? 'bg-primary text-primary-foreground'
            : 'bg-background hover:bg-muted border',
          disabled && 'opacity-50 cursor-not-allowed',
        ]"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        H2
      </button>

      <button
        type="button"
        title="Título 3"
        :aria-pressed="editor?.isActive('heading', { level: 3 }) ?? false"
        :disabled="disabled"
        :class="[
          'px-2 py-1 rounded text-sm font-semibold transition-colors',
          editor?.isActive('heading', { level: 3 })
            ? 'bg-primary text-primary-foreground'
            : 'bg-background hover:bg-muted border',
          disabled && 'opacity-50 cursor-not-allowed',
        ]"
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        H3
      </button>

      <div class="w-px h-6 bg-border self-center mx-1" aria-hidden="true" />

      <button
        type="button"
        title="Lista com marcadores"
        :aria-pressed="editor?.isActive('bulletList') ?? false"
        :disabled="disabled"
        :class="[
          'px-2 py-1 rounded text-sm transition-colors',
          editor?.isActive('bulletList')
            ? 'bg-primary text-primary-foreground'
            : 'bg-background hover:bg-muted border',
          disabled && 'opacity-50 cursor-not-allowed',
        ]"
        @click="editor?.chain().focus().toggleBulletList().run()"
      >
        •—
      </button>

      <button
        type="button"
        title="Lista numerada"
        :aria-pressed="editor?.isActive('orderedList') ?? false"
        :disabled="disabled"
        :class="[
          'px-2 py-1 rounded text-sm transition-colors',
          editor?.isActive('orderedList')
            ? 'bg-primary text-primary-foreground'
            : 'bg-background hover:bg-muted border',
          disabled && 'opacity-50 cursor-not-allowed',
        ]"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      >
        1—
      </button>
    </div>

    <!-- Editor area -->
    <EditorContent
      :editor="editor"
      class="prose prose-sm max-w-none p-3 min-h-[280px] bg-background focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[260px]"
    />
  </div>
</template>
