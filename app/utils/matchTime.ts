export function formatMatchTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return ''
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const mins = Math.floor(clamped / 60)
  const secs = clamped % 60
  return `${mins}:${String(secs).padStart(2, '0')}'`
}
