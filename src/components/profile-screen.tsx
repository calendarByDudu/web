"use client"

import { ChevronRight, Moon, Sun, Users } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type ProfileScreenProps = {
  name?: string
  partnerName?: string | null
}

export function ProfileScreen({
  name = "Dudu",
  partnerName = null,
}: ProfileScreenProps) {
  const { theme, toggleTheme } = useTheme()
  const initial = name.trim().charAt(0).toUpperCase() || "?"

  return (
    <div className="flex min-h-dvh flex-1 flex-col overflow-y-auto pb-28">
      <header className="flex items-center gap-2.5 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
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
          <h1 className="text-xl font-semibold tracking-tight">Perfil</h1>
        </div>
      </header>

      <div className="space-y-4 px-4">
        <section className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-border bg-white px-4 py-6 shadow-sm dark:bg-card">
          <div
            className="flex size-20 items-center justify-center rounded-full bg-secondary text-2xl font-semibold text-foreground"
            aria-hidden
          >
            {initial}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold tracking-tight">{name}</p>
            <p className="text-sm text-muted-foreground">Conta pessoal</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-sm dark:bg-card">
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Users className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Casal</p>
              <p className="truncate text-sm text-muted-foreground">
                {partnerName
                  ? `Com ${partnerName}`
                  : "Convide sua esposa — login depois"}
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-sm dark:bg-card">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                {theme === "dark" ? (
                  <Moon className="size-5" />
                ) : (
                  <Sun className="size-5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">Tema escuro</p>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Ligado" : "Desligado"}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={() => toggleTheme()}
              aria-label="Alternar tema escuro"
            />
          </div>
        </section>

        <p
          className={cn(
            "px-1 pt-2 text-center text-xs text-muted-foreground"
          )}
        >
          calendarByDudu · v0.1.0
        </p>
      </div>
    </div>
  )
}
