"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AddEventDrawer } from "@/components/add-event-drawer"
import { AudienceFilter } from "@/components/audience-filter"
import { BottomBar, type BottomTab } from "@/components/bottom-bar"
import { DaySummaryCard } from "@/components/day-summary-card"
import { EventCard, EventStatCard } from "@/components/event-card"
import { EventDetailDrawer } from "@/components/event-detail-drawer"
import { MonthCalendar } from "@/components/month-calendar"
import { ThemeToggle } from "@/components/theme-toggle"
import { WeekStrip } from "@/components/week-strip"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import {
  MOCK_EVENTS,
  eventDayKey,
  eventsByDay,
  formatEventWhen,
  type CalendarEvent,
  type EventAudience,
} from "@/lib/events"
import { addDays, dayKey, startOfWeek } from "@/lib/dates"

function formatHeader(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function nextEventLabel(events: CalendarEvent[], now: Date) {
  const upcoming =
    events.find((e) => e.allDay) ??
    events.find((e) => new Date(e.startsAt) >= now) ??
    events[0]
  if (!upcoming) return null
  if (upcoming.allDay) return `Dia todo · ${upcoming.title}`
  return `${formatTime(upcoming.startsAt)} · ${upcoming.title}`
}

function EventList({
  events,
  onSelect,
}: {
  events: CalendarEvent[]
  onSelect: (event: CalendarEvent) => void
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-[1.5rem] bg-secondary/50 px-4 py-10 text-center text-base text-muted-foreground">
        Sem eventos neste dia
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {events.map((ev) => (
        <li key={ev.id}>
          <EventCard event={ev} onClick={onSelect} />
        </li>
      ))}
    </ul>
  )
}

export function HomeScreen({
  initialEvents = MOCK_EVENTS,
}: {
  initialEvents?: CalendarEvent[]
}) {
  const today = useMemo(() => new Date(), [])
  const [tab, setTab] = useState<BottomTab>("home")
  const [selected, setSelected] = useState(() => new Date(today))
  const [events, setEvents] = useState(initialEvents)
  const [audienceFilter, setAudienceFilter] =
    useState<EventAudience>("couple")
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [detail, setDetail] = useState<CalendarEvent | null>(null)

  const visibleEvents = useMemo(
    () => events.filter((e) => e.audience === audienceFilter),
    [events, audienceFilter]
  )
  const byDay = useMemo(() => eventsByDay(visibleEvents), [visibleEvents])
  const daysWithEvents = useMemo(() => new Set(byDay.keys()), [byDay])
  const selectedEvents = byDay.get(dayKey(selected)) ?? []
  const timedEvents = selectedEvents.filter((e) => !e.allDay)
  const morning = timedEvents.filter((e) => new Date(e.startsAt).getHours() < 12)
  const afternoon = timedEvents.filter((e) => {
    const h = new Date(e.startsAt).getHours()
    return h >= 12 && h < 18
  })
  const night = timedEvents.filter((e) => new Date(e.startsAt).getHours() >= 18)

  function shiftWeek(delta: number) {
    setSelected((d) => addDays(startOfWeek(d), delta * 7))
  }

  function focusEventDay(event: CalendarEvent) {
    const [y, m, d] = eventDayKey(event.startsAt).split("-").map(Number)
    setSelected(new Date(y, m - 1, d))
    setTab("home")
  }

  function handleSave(event: CalendarEvent) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id)
      if (idx === -1) return [...prev, event]
      const next = [...prev]
      next[idx] = event
      return next
    })
    focusEventDay(event)
    setEditing(null)
    toast.add({
      type: "success",
      title: editing ? "Evento atualizado" : "Evento salvo",
      description: `${event.title} · ${formatEventWhen(event)}`,
      timeout: 3000,
    })
  }

  function handleDelete(event: CalendarEvent) {
    setEvents((prev) => prev.filter((e) => e.id !== event.id))
    setDetail(null)
    toast.add({
      type: "success",
      title: "Evento excluído",
      description: event.title,
      timeout: 3000,
    })
  }

  function handleEdit(event: CalendarEvent) {
    setDetail(null)
    setEditing(event)
    setAddOpen(true)
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-1 flex-col">
      {tab === "home" && (
        <>
          <header className="flex items-center gap-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <img
                src="/logo.svg"
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0 dark:invert"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  calendarByDudu
                </p>
                <h1 className="truncate text-xl font-semibold capitalize tracking-tight">
                  {formatHeader(selected)}
                </h1>
              </div>
            </div>
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label="Semana anterior"
              onClick={() => shiftWeek(-1)}
            >
              <ChevronLeft className="size-6" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label="Próxima semana"
              onClick={() => shiftWeek(1)}
            >
              <ChevronRight className="size-6" />
            </Button>
          </header>

          <div className="space-y-3 px-4 pb-3">
            <AudienceFilter
              value={audienceFilter}
              onChange={setAudienceFilter}
            />
            <WeekStrip
              selected={selected}
              today={today}
              daysWithEvents={daysWithEvents}
              onSelect={setSelected}
            />
          </div>

          <section className="flex-1 space-y-3 overflow-y-auto px-4 pb-28">
            <DaySummaryCard
              events={selectedEvents}
              nextLabel={nextEventLabel(selectedEvents, today)}
            />

            <div className="grid grid-cols-3 gap-2">
              <EventStatCard label="Manhã" value={String(morning.length)} hint="até 12h" />
              <EventStatCard label="Tarde" value={String(afternoon.length)} hint="12–18h" />
              <EventStatCard label="Noite" value={String(night.length)} hint="após 18h" />
            </div>

            <div>
              <h2 className="mb-2.5 px-0.5 text-sm font-medium text-muted-foreground">
                Agenda
              </h2>
              <EventList
                events={selectedEvents}
                onSelect={(ev) => setDetail(ev)}
              />
            </div>
          </section>
        </>
      )}

      {tab === "month" && (
        <div className="flex flex-1 flex-col overflow-y-auto pb-28 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="px-4 pb-2">
            <AudienceFilter
              value={audienceFilter}
              onChange={setAudienceFilter}
            />
          </div>
          <MonthCalendar events={visibleEvents} />
        </div>
      )}

      <BottomBar
        active={tab}
        onTabChange={setTab}
        onAdd={() => {
          setEditing(null)
          setAddOpen(true)
        }}
      />

      <EventDetailDrawer
        event={detail}
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddEventDrawer
        open={addOpen}
        defaultDate={selected}
        event={editing}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) setEditing(null)
        }}
        onSave={handleSave}
      />
    </div>
  )
}
