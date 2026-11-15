export function dayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Sunday-start week (dom → sáb) */
export function startOfWeek(d: Date) {
  const date = startOfDay(d)
  date.setDate(date.getDate() - date.getDay())
  return date
}

export function addDays(d: Date, n: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

export function weekDays(anchor: Date) {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function isBeforeDay(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime()
}
