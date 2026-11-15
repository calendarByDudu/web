import { apiFetch } from "@/lib/auth"
import { dayKey } from "@/lib/dates"

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
  startsAt: string // ISO (API manda UTC com Z)
  endsAt?: string
  allDay?: boolean
  notes?: string
  audience: EventAudience
  category: EventCategory
  color: "blue" | "green" | "amber" | "rose" | "violet"
  /** UUID do criador — só ele edita/deleta */
  createdById: string
  coupleId?: string
  createdAt?: string
  updatedAt?: string
}

/** Mock placeholder remapped to the logged-in user on boot */
export const EVENT_OWNER_SELF = "self"

type ApiEvent = {
  id: string
  title: string
  startsAt: string
  endsAt?: string | null
  allDay?: boolean
  notes?: string | null
  audience: EventAudience
  category: EventCategory
  color: CalendarEvent["color"]
  createdById?: string
  createdBy?: string | { id?: string }
  coupleId?: string | null
  createdAt?: string
  updatedAt?: string
}

function ownerIdFromApi(raw: ApiEvent): string {
  if (typeof raw.createdById === "string" && raw.createdById) {
    return raw.createdById
  }
  if (typeof raw.createdBy === "string" && raw.createdBy) {
    return raw.createdBy
  }
  if (
    raw.createdBy &&
    typeof raw.createdBy === "object" &&
    typeof raw.createdBy.id === "string"
  ) {
    return raw.createdBy.id
  }
  return ""
}

export function normalizeEvent(raw: ApiEvent): CalendarEvent {
  return {
    id: raw.id,
    title: raw.title,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt ?? undefined,
    allDay: Boolean(raw.allDay),
    notes: raw.notes ?? undefined,
    audience: raw.audience,
    category: raw.category,
    color: raw.color,
    createdById: ownerIdFromApi(raw),
    coupleId: raw.coupleId ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
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
    createdById: EVENT_OWNER_SELF,
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
    createdById: EVENT_OWNER_SELF,
  },
  {
    id: "3",
    title: "Mercado",
    startsAt: "2026-11-15T10:00:00",
    endsAt: "2026-11-15T11:00:00",
    audience: "couple",
    category: "casa",
    color: "green",
    createdById: "partner",
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
    createdById: EVENT_OWNER_SELF,
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
    createdById: "partner",
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
    createdById: EVENT_OWNER_SELF,
  },
  {
    id: "7",
    title: "Cinema",
    startsAt: "2026-11-14T20:00:00",
    endsAt: "2026-11-14T22:30:00",
    audience: "couple",
    category: "saidinha",
    color: "violet",
    createdById: EVENT_OWNER_SELF,
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
  return dayKey(new Date(iso))
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

export type ListEventsParams = {
  audience?: EventAudience
  from?: string // yyyy-MM-dd
  to?: string // yyyy-MM-dd
}

async function readEventsApiError(
  res: Response,
  fallback: string
): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    if (body.error?.message) return body.error.message
  } catch {
    // ignore
  }
  return fallback
}

export async function listEvents(
  params: ListEventsParams = {}
): Promise<CalendarEvent[]> {
  const q = new URLSearchParams()
  if (params.audience) q.set("audience", params.audience)
  if (params.from) q.set("from", params.from)
  if (params.to) q.set("to", params.to)
  const qs = q.toString()
  const res = await apiFetch(`/events${qs ? `?${qs}` : ""}`)
  if (!res.ok) {
    throw new Error(
      await readEventsApiError(res, "Não foi possível carregar eventos")
    )
  }
  const data = (await res.json()) as { items?: ApiEvent[] } | ApiEvent[]
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
      ? data.items
      : []
  return items.map(normalizeEvent)
}

export type EventFormInput = {
  title: string
  date: string // yyyy-mm-dd
  startTime: string // HH:mm
  endTime: string // HH:mm
  allDay?: boolean
  notes?: string
  audience: EventAudience
  category: EventCategory
  color: CalendarEvent["color"]
}

function clockFromIso(iso: string) {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

/** RFC 3339 com offset local — Ajv `format: date-time` rejeita sem tz. */
function toRfc3339Local(date: string, time: string, seconds = "00") {
  const wall = `${date}T${time}:${seconds}`
  const offsetMin = -new Date(wall).getTimezoneOffset()
  const sign = offsetMin >= 0 ? "+" : "-"
  const abs = Math.abs(offsetMin)
  const oh = String(Math.floor(abs / 60)).padStart(2, "0")
  const om = String(abs % 60).padStart(2, "0")
  return `${wall}${sign}${oh}:${om}`
}

function formToStartsEnds(input: EventFormInput) {
  if (input.allDay) {
    return {
      startsAt: toRfc3339Local(input.date, "00:00"),
      endsAt: toRfc3339Local(input.date, "23:59", "59"),
      allDay: true as const,
    }
  }
  return {
    startsAt: toRfc3339Local(input.date, input.startTime),
    endsAt: toRfc3339Local(input.date, input.endTime),
    allDay: false as const,
  }
}

function isScheduleChanged(
  input: EventFormInput,
  previous: CalendarEvent
): boolean {
  if (Boolean(input.allDay) !== Boolean(previous.allDay)) return true
  if (eventDayKey(previous.startsAt) !== input.date) return true
  if (input.allDay) return false
  return (
    clockFromIso(previous.startsAt) !== input.startTime ||
    clockFromIso(previous.endsAt ?? previous.startsAt) !== input.endTime
  )
}

export async function createEvent(
  input: EventFormInput
): Promise<CalendarEvent> {
  const title = input.title.trim()
  const notes = input.notes?.trim()
  const range = formToStartsEnds(input)
  const res = await apiFetch("/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      startsAt: range.startsAt,
      endsAt: range.endsAt,
      allDay: range.allDay,
      notes: notes || undefined,
      audience: input.audience,
      category: input.category,
      color: input.color,
    }),
  })
  if (!res.ok) {
    throw new Error(
      await readEventsApiError(res, "Não foi possível criar o evento")
    )
  }
  return normalizeEvent((await res.json()) as ApiEvent)
}

export async function updateEvent(
  eventId: string,
  input: EventFormInput,
  previous?: CalendarEvent
): Promise<CalendarEvent> {
  const title = input.title.trim()
  const notes = input.notes?.trim() ?? ""
  const body: Record<string, unknown> = {
    title,
    notes,
    audience: input.audience,
    category: input.category,
    color: input.color,
  }
  // PATCH parcial: não reenviar agenda se não mudou (evita rejeição de all-day/Z)
  if (!previous || isScheduleChanged(input, previous)) {
    const range = formToStartsEnds(input)
    body.startsAt = range.startsAt
    body.endsAt = range.endsAt
    body.allDay = range.allDay
  }
  const res = await apiFetch(`/events/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(
      await readEventsApiError(
        res,
        `Não foi possível atualizar o evento (${res.status})`
      )
    )
  }
  return normalizeEvent((await res.json()) as ApiEvent)
}

export async function deleteEvent(eventId: string): Promise<void> {
  const res = await apiFetch(`/events/${eventId}`, { method: "DELETE" })
  if (!res.ok) {
    throw new Error(
      await readEventsApiError(res, "Não foi possível excluir o evento")
    )
  }
}

export function canManageEvent(event: CalendarEvent, userId: string) {
  const owner = event.createdById?.trim()
  const me = userId?.trim()
  // sem dono conhecido → ninguém edita (não liberar por padrão)
  if (!owner || !me) return false
  return owner === me
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
