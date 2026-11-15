"use client"

import { useState } from "react"
import { ChevronRight, LogOut, Moon, Sun, Users } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type ProfileScreenProps = {
  name: string
  email: string
  partnerName?: string | null
  hasCouple?: boolean
  onCouple: () => void
  onLogout: () => void
}

export function ProfileScreen({
  name,
  email,
  partnerName = null,
  hasCouple = false,
  onCouple,
  onLogout,
}: ProfileScreenProps) {
  const { theme, toggleTheme } = useTheme()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const initial = name.trim().charAt(0).toUpperCase() || "?"

  return (
    <>
    <ScrollArea className="min-h-0 flex-1">
      <div className="pb-28">
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
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-sm dark:bg-card">
            <button
              type="button"
              onClick={onCouple}
              className="flex w-full items-center gap-3 px-4 py-4 text-left"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Users className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Casal</p>
                <p className="truncate text-sm text-muted-foreground">
                  {hasCouple || partnerName
                    ? partnerName
                      ? `Ver casal · ${partnerName}`
                      : "Ver casal"
                    : "Convide com um código"}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </button>
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

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-center gap-2 rounded-2xl text-base"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="size-5" />
            Sair
          </Button>

          <p
            className={cn(
              "px-1 pt-2 text-center text-xs text-muted-foreground"
            )}
          >
            calendarByDudu · v0.1.0
          </p>
        </div>
      </div>
    </ScrollArea>

    <Drawer open={logoutOpen} onOpenChange={setLogoutOpen} showSwipeHandle>
      <DrawerContent className="mx-auto w-full max-w-[430px] rounded-t-[1.75rem] border-t">
        <DrawerHeader className="gap-1 px-5 pt-1 pb-2 text-left">
          <DrawerTitle className="text-xl font-semibold tracking-tight">
            Sair da conta?
          </DrawerTitle>
          <DrawerDescription className="text-left text-base">
            Você vai precisar entrar de novo pra ver a agenda.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button
            type="button"
            variant="destructive"
            className="h-14 w-full gap-2 rounded-full text-base font-semibold"
            onClick={() => {
              setLogoutOpen(false)
              onLogout()
            }}
          >
            <LogOut className="size-5" />
            Sim, sair
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-12 rounded-full text-base"
            onClick={() => setLogoutOpen(false)}
          >
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    </>
  )
}
