"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  EVENT_COLOR,
  MOCK_EVENTS,
  eventsByDay,
  formatEventWhen,
  type CalendarEvent,
} from "@/lib/events"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"] as const

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatMonthTitle(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
}

function formatSelected(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function buildWeeks(month: Date) {
  const first = startOfMonth(month)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay()) // Sunday start

  const weeks: Date[][] = []
  const cursor = new Date(start)
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

const MAX_PILLS = 3

export function MonthCalendar({
  events = MOCK_EVENTS,
}: {
  events?: CalendarEvent[]
}) {
  const today = useMemo(() => new Date(), [])
  const [month, setMonth] = useState(() => startOfMonth(today))
  const [selected, setSelected] = useState(() => new Date(today))

  const byDay = useMemo(() => eventsByDay(events), [events])
  const weeks = useMemo(() => buildWeeks(month), [month])
  const selectedKey = dayKey(selected)
  const selectedEvents = byDay.get(selectedKey) ?? []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-4">
        <img
          src="/logo.svg"
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 dark:invert"
        />
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight capitalize sm:text-xl">
          {formatMonthTitle(month)}
        </h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => {
            setMonth(startOfMonth(today))
            setSelected(new Date(today))
          }}
        >
          Hoje
        </Button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Mês anterior"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Próximo mês"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-y border-border">
        {WEEKDAYS.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className="py-1.5 text-center text-[11px] font-medium text-muted-foreground sm:text-xs"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-rows-6 border-b border-border">
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid min-h-[4.5rem] grid-cols-7 border-b border-border last:border-b-0 sm:min-h-[5.5rem]"
          >
            {week.map((date) => {
              const inMonth = date.getMonth() === month.getMonth()
              const key = dayKey(date)
              const dayEvents = byDay.get(key) ?? []
              const isToday = sameDay(date, today)
              const isSelected = sameDay(date, selected)
              const overflow = dayEvents.length - MAX_PILLS

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(date)}
                  className={cn(
                    "flex min-h-0 flex-col gap-0.5 overflow-hidden border-r border-border p-0.5 text-left transition-colors last:border-r-0 sm:p-1",
                    "hover:bg-muted/40 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected && "bg-muted/50",
                    !inMonth && "bg-background/40"
                  )}
                >
                  <span
                    className={cn(
                      "mx-auto flex size-6 items-center justify-center rounded-full text-xs tabular-nums sm:mx-0 sm:ml-0.5",
                      !inMonth && "text-muted-foreground/50",
                      inMonth && "text-foreground",
                      isToday &&
                        "bg-primary text-primary-foreground font-semibold",
                      isSelected &&
                        !isToday &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    {date.getDate()}
                  </span>

                  <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, MAX_PILLS).map((ev) => (
                      <span
                        key={ev.id}
                        className={cn(
                          "truncate rounded-sm px-1 py-px text-[9px] leading-tight sm:text-[10px]",
                          EVENT_COLOR[ev.color],
                          !inMonth && "opacity-50"
                        )}
                      >
                        <span className="hidden sm:inline">
                          {formatTime(ev.startsAt)}{" "}
                        </span>
                        {ev.title}
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="px-1 text-[9px] text-muted-foreground sm:text-[10px]">
                        +{overflow}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <section className="border-t border-border px-3 py-3 sm:px-4">
        <h2 className="text-sm font-medium capitalize text-muted-foreground">
          {formatSelected(selected)}
        </h2>
        {selectedEvents.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sem eventos</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {selectedEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-2 rounded-lg bg-secondary/60 px-2.5 py-2"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    EVENT_COLOR[ev.color].split(" ")[0]
                  )}
                />
                <span className="min-w-12 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatEventWhen(ev)}
                </span>
                <span className="truncate text-sm">{ev.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
