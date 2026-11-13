import { ProgressRing } from "@/components/ui/progress-ring"
import {
  EVENT_SOFT_DOT,
  type CalendarEvent,
} from "@/lib/events"
import { cn } from "@/lib/utils"

type DaySummaryCardProps = {
  events: CalendarEvent[]
  nextLabel?: string | null
}

export function DaySummaryCard({ events, nextLabel }: DaySummaryCardProps) {
  const count = events.length
  // ponytail: ring = density proxy, not real progress
  const ring = Math.min(1, count / 4)

  return (
    <div className="rounded-[1.75rem] bg-secondary/70 px-5 py-5 dark:bg-secondary/50">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[2.75rem] leading-none font-semibold tracking-tight tabular-nums">
            {count}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {count === 1 ? "evento hoje" : "eventos hoje"}
          </p>
          {nextLabel ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Próximo · <span className="text-foreground">{nextLabel}</span>
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Dia livre</p>
          )}
        </div>

        <div className="relative shrink-0">
          <ProgressRing
            value={ring}
            size={88}
            stroke={7}
            indicatorClassName="stroke-emerald-500"
            trackClassName="stroke-muted-foreground/20"
          >
            <div className="flex -space-x-1.5">
              {events.slice(0, 3).map((ev) => (
                <span
                  key={ev.id}
                  className={cn(
                    "size-5 rounded-full border-2 border-secondary ring-0",
                    EVENT_SOFT_DOT[ev.color]
                  )}
                  title={ev.title}
                />
              ))}
              {count === 0 && (
                <span className="size-5 rounded-full bg-muted-foreground/20" />
              )}
            </div>
          </ProgressRing>
        </div>
      </div>
    </div>
  )
}
