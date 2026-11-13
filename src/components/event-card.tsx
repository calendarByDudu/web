import { Badge } from "@/components/ui/badge"
import {
  EVENT_AUDIENCE_LABEL,
  EVENT_CATEGORY_LABEL,
  EVENT_SOFT_DOT,
  formatEventWhen,
  type CalendarEvent,
} from "@/lib/events"
import { cn } from "@/lib/utils"

type EventCardProps = {
  event: CalendarEvent
  onClick?: (event: CalendarEvent) => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className="w-full rounded-[1.5rem] border border-border bg-white px-4 py-4 text-left text-foreground shadow-sm active:scale-[0.99] dark:bg-card"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-2 size-3 shrink-0 rounded-full",
            EVENT_SOFT_DOT[event.color]
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {event.title}
            </h3>
            <time className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {formatEventWhen(event)}
            </time>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {EVENT_CATEGORY_LABEL[event.category]}
            </Badge>
            <Badge variant="outline">
              {EVENT_AUDIENCE_LABEL[event.audience]}
            </Badge>
          </div>
          {event.notes ? (
            <p className="mt-1.5 truncate text-sm text-muted-foreground">
              {event.notes}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  )
}

type EventStatCardProps = {
  label: string
  value: string
  hint?: string
  className?: string
}

/** Small Cal-AI style metric tile */
export function EventStatCard({
  label,
  value,
  hint,
  className,
}: EventStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] bg-secondary/70 px-3.5 py-3.5 dark:bg-secondary/50",
        className
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
