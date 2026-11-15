"use client"

import { dayKey, isBeforeDay, sameDay, weekDays } from "@/lib/dates"
import { cn } from "@/lib/utils"

const DAY_LABEL = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const

type WeekStripProps = {
  selected: Date
  today: Date
  daysWithEvents?: Set<string>
  onSelect: (date: Date) => void
}

export function WeekStrip({
  selected,
  today,
  daysWithEvents,
  onSelect,
}: WeekStripProps) {
  const days = weekDays(selected)

  return (
    <div className="grid grid-cols-7 gap-0.5">
      {days.map((date) => {
        const key = dayKey(date)
        const isSelected = sameDay(date, selected)
        const isToday = sameDay(date, today)
        const past = isBeforeDay(date, today)
        const hasEvents = daysWithEvents?.has(key) ?? false
        const weekday = DAY_LABEL[date.getDay()]

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(date)}
            className="flex flex-col items-center gap-1.5 rounded-2xl py-2 outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={cn(
                "text-[11px] capitalize leading-none text-muted-foreground",
                isSelected && "font-semibold text-foreground"
              )}
            >
              {weekday}
            </span>
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-full border text-base tabular-nums transition-colors",
                past &&
                  !isSelected &&
                  "border-dashed border-muted-foreground/35 text-muted-foreground/70",
                !past &&
                  !isSelected &&
                  "border-border text-foreground",
                !past &&
                  !isSelected &&
                  (hasEvents || isToday) &&
                  "border-emerald-500/70",
                isSelected &&
                  "border-emerald-500 bg-emerald-500 font-semibold text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-500"
              )}
            >
              {date.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}
