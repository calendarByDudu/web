/** Who the event is for — both partners still see every event */
export type EventAudience = "me" | "couple"

export type EventCategory =
  | "saidinha"
  | "restaurante"
  | "aniversario"
  | "saude"
  | "trabalho"
  | "casa"
  | "viagem"
  | "outro"

export type CalendarEvent = {
  id: string
  title: string
  startsAt: string // ISO local-ish
  endsAt?: string
  allDay?: boolean
  notes?: string
  audience: EventAudience
  category: EventCategory
  color: "blue" | "green" | "amber" | "rose" | "violet"
}

export const EVENT_AUDIENCE_LABEL: Record<EventAudience, string> = {
  me: "Só eu",
  couple: "Casal",
}

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  saidinha: "Saidinha",
  restaurante: "Restaurante",
  aniversario: "Aniversário",
  saude: "Saúde",
  trabalho: "Trabalho",
  casa: "Casa",
  viagem: "Viagem",
  outro: "Outro",
}

export const EVENT_CATEGORIES = [
  "saidinha",
  "restaurante",
  "aniversario",
  "saude",
  "trabalho",
  "casa",
  "viagem",
  "outro",
] as const satisfies readonly EventCategory[]

/** ponytail: mock until DB exists — both still visible to everyone */
export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "Dentista",
    startsAt: "2026-11-13T09:00:00",
    endsAt: "2026-11-13T10:00:00",
    notes: "Consulta de rotina",
    audience: "me",
    category: "saude",
    color: "blue",
  },
  {
    id: "2",
    title: "Jantar",
    startsAt: "2026-11-13T19:30:00",
    endsAt: "2026-11-13T21:00:00",
    notes: "Com a familia",
    audience: "couple",
    category: "restaurante",
    color: "rose",
  },
  {
    id: "3",
    title: "Mercado",
    startsAt: "2026-11-15T10:00:00",
    endsAt: "2026-11-15T11:00:00",
    audience: "couple",
    category: "casa",
    color: "green",
  },
  {
    id: "4",
    title: "Reunião escola",
    startsAt: "2026-11-18T18:00:00",
    endsAt: "2026-11-18T19:00:00",
    notes: "Sala 2",
    audience: "couple",
    category: "trabalho",
    color: "amber",
  },
  {
    id: "5",
    title: "Aniversário",
    startsAt: "2026-11-22T00:00:00",
    endsAt: "2026-11-22T23:59:59",
    allDay: true,
    audience: "couple",
    category: "aniversario",
    color: "violet",
  },
  {
    id: "6",
    title: "Academia",
    startsAt: "2026-11-14T07:00:00",
    endsAt: "2026-11-14T08:00:00",
    notes: "Treino A",
    audience: "me",
    category: "saude",
    color: "blue",
  },
  {
    id: "7",
    title: "Cinema",
    startsAt: "2026-11-14T20:00:00",
    endsAt: "2026-11-14T22:30:00",
    audience: "couple",
    category: "saidinha",
    color: "violet",
  },
]

export const EVENT_COLOR: Record<CalendarEvent["color"], string> = {
  blue: "bg-sky-500/90 text-sky-50",
  green: "bg-emerald-500/90 text-emerald-50",
  amber: "bg-amber-500/90 text-amber-950",
  rose: "bg-rose-500/90 text-rose-50",
  violet: "bg-violet-500/90 text-violet-50",
}

/** Soft fill like Cal AI cards */
export const EVENT_SOFT_BG: Record<CalendarEvent["color"], string> = {
  blue: "bg-sky-500/12 dark:bg-sky-500/15",
  green: "bg-emerald-500/12 dark:bg-emerald-500/15",
  amber: "bg-amber-500/14 dark:bg-amber-500/15",
  rose: "bg-rose-500/12 dark:bg-rose-500/15",
  violet: "bg-violet-500/12 dark:bg-violet-500/15",
}

export const EVENT_SOFT_DOT: Record<CalendarEvent["color"], string> = {
  blue: "bg-sky-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
}

export const EVENT_COLORS = [
  "blue",
  "green",
  "amber",
  "rose",
  "violet",
] as const satisfies readonly CalendarEvent["color"][]

export function eventDayKey(iso: string) {
  return iso.slice(0, 10)
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatEventWhen(event: CalendarEvent) {
  if (event.allDay) return "Dia todo"
  const start = formatClock(event.startsAt)
  if (!event.endsAt) return start
  return `${start} – ${formatClock(event.endsAt)}`
}

export function addMinutesToTime(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + minutes
  const clamped = Math.min(23 * 60 + 59, Math.max(0, total))
  const hh = String(Math.floor(clamped / 60)).padStart(2, "0")
  const mm = String(clamped % 60).padStart(2, "0")
  return `${hh}:${mm}`
}

export function formatEventDate(event: CalendarEvent) {
  return new Date(event.startsAt).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function createEvent(
  input: {
    title: string
    date: string // yyyy-mm-dd
    startTime: string // HH:mm
    endTime: string // HH:mm
    allDay?: boolean
    notes?: string
    audience: EventAudience
    category: EventCategory
    color: CalendarEvent["color"]
  },
  id = crypto.randomUUID()
): CalendarEvent {
  const title = input.title.trim()
  const notes = input.notes?.trim()
  if (input.allDay) {
    return {
      id,
      title,
      startsAt: `${input.date}T00:00:00`,
      endsAt: `${input.date}T23:59:59`,
      allDay: true,
      notes: notes || undefined,
      audience: input.audience,
      category: input.category,
      color: input.color,
    }
  }
  return {
    id,
    title,
    startsAt: `${input.date}T${input.startTime}:00`,
    endsAt: `${input.date}T${input.endTime}:00`,
    allDay: false,
    notes: notes || undefined,
    audience: input.audience,
    category: input.category,
    color: input.color,
  }
}

export function eventsByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const key = eventDayKey(e.startsAt)
    const list = map.get(key)
    if (list) list.push(e)
    else map.set(key, [e])
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      if (a.allDay && !b.allDay) return -1
      if (!a.allDay && b.allDay) return 1
      return a.startsAt.localeCompare(b.startsAt)
    })
  }
  return map
}
