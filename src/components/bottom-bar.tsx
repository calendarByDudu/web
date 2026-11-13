"use client"

import { CalendarDays, Home, Plus } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export type BottomTab = "home" | "month"

type BottomBarProps = {
  active: BottomTab
  onTabChange: (tab: BottomTab) => void
  onAdd: () => void
}

const TABS: {
  id: BottomTab
  label: string
  icon: typeof Home
}[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "month", label: "Calendário", icon: CalendarDays },
]

export function BottomBar({ active, onTabChange, onAdd }: BottomBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-full items-end gap-2">
        <nav
          className="relative flex h-16 min-w-0 flex-1 items-center rounded-full border border-border bg-card/95 p-1 shadow-lg backdrop-blur-md"
          aria-label="Navegação"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={cn(
                  "relative z-10 flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px]",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="bottom-tab-pill"
                    className="absolute inset-0 rounded-full bg-muted"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                      mass: 0.8,
                    }}
                  />
                ) : null}

                <motion.span
                  className="relative z-10 flex flex-col items-center gap-0.5"
                  animate={{
                    scale: isActive ? 1 : 0.96,
                    opacity: isActive ? 1 : 0.72,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                >
                  <motion.span
                    animate={{ y: isActive ? 0 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Icon
                      className="size-6"
                      strokeWidth={isActive ? 2.35 : 1.75}
                    />
                  </motion.span>
                  <span className="truncate font-medium leading-none">
                    {label}
                  </span>
                </motion.span>
              </button>
            )
          })}
        </nav>

        <motion.button
          type="button"
          onClick={onAdd}
          aria-label="Adicionar evento"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          <Plus className="size-8" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  )
}
