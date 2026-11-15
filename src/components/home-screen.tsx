"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AddEventDrawer } from "@/components/add-event-drawer"
import { AudienceFilter } from "@/components/audience-filter"
import { BottomBar, type BottomTab } from "@/components/bottom-bar"
import { DaySummaryCard } from "@/components/day-summary-card"
import { EventCard, EventStatCard } from "@/components/event-card"
import { EventDetailDrawer } from "@/components/event-detail-drawer"
import { MonthCalendar } from "@/components/month-calendar"
import { CoupleDrawer } from "@/components/couple-drawer"
import { ProfileScreen } from "@/components/profile-screen"
import { WeekStrip } from "@/components/week-strip"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/toast"
import {
  canManageEvent,
  eventDayKey,
  eventsByDay,
  formatEventWhen,
  listEvents,
  type CalendarEvent,
  type EventAudience,
} from "@/lib/events"
import { getSessionUserId, type AuthUser } from "@/lib/auth"
import {
  getCouple,
  type CouplePartner,
  type CoupleStats,
} from "@/lib/couple"
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
  user,
  onLogout,
}: {
  user: AuthUser
  onLogout: () => void
}) {
  const today = useMemo(() => new Date(), [])
  const [tab, setTab] = useState<BottomTab>("home")
  const [selected, setSelected] = useState(() => new Date(today))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [audienceFilter, setAudienceFilter] =
    useState<EventAudience>("couple")
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [detail, setDetail] = useState<CalendarEvent | null>(null)
  const [coupleOpen, setCoupleOpen] = useState(false)
  const [partner, setPartner] = useState<CouplePartner | null>(null)
  const [coupleStats, setCoupleStats] = useState<CoupleStats | null>(null)
  const [coupleFetched, setCoupleFetched] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCoupleFetched(false)
    ;(async () => {
      try {
        const status = await getCouple(user.id)
        if (cancelled) return
        setPartner(status.partner)
        setCoupleStats(status.stats ?? null)
      } catch {
        if (cancelled) return
        setPartner(null)
        setCoupleStats(null)
      } finally {
        if (!cancelled) setCoupleFetched(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user.email, user.id])

  const rangeFrom = useMemo(() => {
    // mês anterior → mês seguinte (cobre week strip + month calendar)
    return dayKey(new Date(selected.getFullYear(), selected.getMonth() - 1, 1))
  }, [selected])
  const rangeTo = useMemo(() => {
    return dayKey(new Date(selected.getFullYear(), selected.getMonth() + 2, 0))
  }, [selected])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const items = await listEvents({
          audience: audienceFilter,
          from: rangeFrom,
          to: rangeTo,
        })
        if (!cancelled) setEvents(items)
      } catch (err) {
        if (cancelled) return
        toast.add({
          type: "error",
          title:
            err instanceof Error ? err.message : "Erro ao carregar eventos",
          timeout: 4000,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [audienceFilter, rangeFrom, rangeTo])

  const byDay = useMemo(() => eventsByDay(events), [events])
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

  const sessionUserId = getSessionUserId() ?? user.id

  function handleDelete(event: CalendarEvent) {
    if (!canManageEvent(event, sessionUserId)) return
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
    if (!canManageEvent(event, sessionUserId)) return
    setDetail(null)
    setEditing(event)
    setAddOpen(true)
  }

  return (
    <div className="relative flex h-dvh max-h-dvh w-full flex-1 flex-col overflow-hidden">
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

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3 px-4 pb-28">
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
            </div>
          </ScrollArea>
        </>
      )}

      {tab === "month" && (
        <div className="flex min-h-0 flex-1 flex-col pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="shrink-0 px-4 pb-2">
            <AudienceFilter
              value={audienceFilter}
              onChange={setAudienceFilter}
            />
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="pb-28">
              <MonthCalendar
                events={events}
                onSelectEvent={(ev) => setDetail(ev)}
              />
            </div>
          </ScrollArea>
        </div>
      )}

      {tab === "profile" && (
        <ProfileScreen
          name={user.name}
          email={user.email}
          partnerName={partner?.name ?? null}
          hasCouple={
            Boolean(partner) ||
            (!coupleFetched && Boolean(user.coupleId))
          }
          onCouple={() => setCoupleOpen(true)}
          onLogout={onLogout}
        />
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
        userId={sessionUserId}
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

      <CoupleDrawer
        open={coupleOpen}
        onOpenChange={setCoupleOpen}
        user={user}
        events={events}
        initialPartner={partner}
        initialStats={coupleStats}
        onPartnerChange={setPartner}
        onStatsChange={setCoupleStats}
      />
    </div>
  )
}
