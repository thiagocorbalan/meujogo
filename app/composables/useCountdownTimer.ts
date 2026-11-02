import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'

interface CountdownTimer {
  remainingSeconds: Ref<number>
  isTimeUp: ComputedRef<boolean>
  isOvertime: ComputedRef<boolean>
  display: ComputedRef<string>
  start: () => void
  stop: () => void
}

export function useCountdownTimer(
  durationSeconds: Ref<number>,
  startTimestamp: Ref<string | null>,
): CountdownTimer {
  const remainingSeconds = ref(durationSeconds.value)
  let interval: ReturnType<typeof setInterval> | null = null

  const isTimeUp = computed(() => remainingSeconds.value <= 0)
  const isOvertime = computed(() => false)

  const display = computed(() => {
    const clamped = Math.max(0, remainingSeconds.value)
    const mins = Math.floor(clamped / 60)
    const secs = clamped % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  function start() {
    stop()
    if (!startTimestamp.value) return

    const startTime = new Date(startTimestamp.value).getTime()

    function tick() {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = durationSeconds.value - elapsed
      remainingSeconds.value = Math.max(0, remaining)
      if (remaining <= 0) stop()
    }

    tick()
    interval = setInterval(tick, 1000)
  }

  function stop() {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  watch(startTimestamp, (val) => {
    if (val) {
      start()
    } else {
      stop()
      remainingSeconds.value = durationSeconds.value
    }
  }, { immediate: true })

  onUnmounted(stop)

  return { remainingSeconds, isTimeUp, isOvertime, display, start, stop }
}
