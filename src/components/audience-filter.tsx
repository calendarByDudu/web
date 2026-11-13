"use client"

import {
  EVENT_AUDIENCE_LABEL,
  type EventAudience,
} from "@/lib/events"
import { cn } from "@/lib/utils"

type AudienceFilterProps = {
  value: EventAudience
  onChange: (value: EventAudience) => void
}

export function AudienceFilter({ value, onChange }: AudienceFilterProps) {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary/80 p-1 dark:bg-secondary/60"
      role="tablist"
      aria-label="Filtrar eventos"
    >
      {(["couple", "me"] as const).map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option)}
            className={cn(
              "h-10 rounded-xl text-sm font-medium transition-colors",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {EVENT_AUDIENCE_LABEL[option]}
          </button>
        )
      })}
    </div>
  )
}
