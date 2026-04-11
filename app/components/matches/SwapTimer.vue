<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  durationSeconds: number
  active: boolean
}>()

const emit = defineEmits<{
  'time-up': []
}>()

const remaining = ref(props.durationSeconds)
const finished = ref(false)
let interval: ReturnType<typeof setInterval> | null = null
let startTime: number | null = null

const display = computed(() => {
  const abs = Math.max(0, remaining.value)
  const mins = Math.floor(abs / 60)
  const secs = abs % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

function start() {
  stop()
  remaining.value = props.durationSeconds
  finished.value = false
  startTime = Date.now()

  interval = setInterval(() => {
    if (!startTime) return
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    remaining.value = Math.max(0, props.durationSeconds - elapsed)

    if (remaining.value <= 0 && !finished.value) {
      finished.value = true
      stop()
      emit('time-up')
    }
  }, 1000)
}

function stop() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

watch(() => props.active, (active) => {
  if (active) {
    start()
  } else {
    stop()
  }
}, { immediate: true })

onUnmounted(stop)
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-6 px-8 bg-amber-50 border border-amber-200 rounded-lg">
    <p class="text-sm font-semibold text-amber-800 uppercase tracking-wide">Intervalo — Troca de Time</p>
    <span
      :class="[
        'font-mono text-2xl font-bold tabular-nums',
        finished ? 'text-green-600' : 'text-amber-900',
      ]"
    >
      {{ finished ? 'Pronto!' : display }}
    </span>
  </div>
</template>
