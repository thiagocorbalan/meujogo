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
  const isOvertime = computed(() => remainingSeconds.value < 0)

  const display = computed(() => {
    const abs = Math.abs(remainingSeconds.value)
    const mins = Math.floor(abs / 60)
    const secs = abs % 60
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    return isOvertime.value ? `+${formatted}` : formatted
  })

  function start() {
    stop()
    if (!startTimestamp.value) return

    const startTime = new Date(startTimestamp.value).getTime()

    function tick() {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      remainingSeconds.value = durationSeconds.value - elapsed
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
  })

  onUnmounted(stop)

  return { remainingSeconds, isTimeUp, isOvertime, display, start, stop }
}
