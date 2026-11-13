"use client"

import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Spinner } from "@/components/ui/spinner"
import {
  EVENT_SOFT_BG,
  EVENT_SOFT_DOT,
  formatEventDate,
  formatEventWhen,
  type CalendarEvent,
} from "@/lib/events"
import { cn } from "@/lib/utils"

type EventDetailDrawerProps = {
  event: CalendarEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (event: CalendarEvent) => void
  onDelete: (event: CalendarEvent) => void
}

export function EventDetailDrawer({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: EventDetailDrawerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) {
      setConfirmOpen(false)
      setDeleting(false)
    }
  }, [open])

  useEffect(() => {
    if (!confirmOpen) setDeleting(false)
  }, [confirmOpen])

  async function confirmDelete() {
    if (!event || deleting) return
    setDeleting(true)
    // ponytail: fake wait until real API exists
    await new Promise((r) => setTimeout(r, 600))
    setConfirmOpen(false)
    onDelete(event)
    setDeleting(false)
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent className="mx-auto w-full max-w-[430px] rounded-t-[1.75rem] border-t data-[swipe-axis=y]:[--drawer-content-max-height:85dvh]">
          {event ? (
            <>
              <DrawerHeader className="gap-1 px-5 pt-1 pb-2 text-left">
                <DrawerTitle className="text-xl font-semibold tracking-tight">
                  {event.title}
                </DrawerTitle>
              </DrawerHeader>

              <div className="space-y-3 px-5 py-2">
                <div
                  className={cn(
                    "rounded-[1.5rem] px-4 py-4",
                    EVENT_SOFT_BG[event.color]
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-3 shrink-0 rounded-full",
                        EVENT_SOFT_DOT[event.color]
                      )}
                    />
                    <p className="text-base font-medium capitalize">
                      {formatEventDate(event)}
                    </p>
                  </div>
                  <p className="mt-2 text-base tabular-nums text-muted-foreground">
                    {formatEventWhen(event)}
                  </p>
                </div>

                {event.notes ? (
                  <div className="rounded-[1.5rem] bg-secondary/80 px-4 py-4 dark:bg-secondary/60">
                    <p className="text-sm font-medium text-muted-foreground">
                      Nota
                    </p>
                    <p className="mt-1 text-base whitespace-pre-wrap">
                      {event.notes}
                    </p>
                  </div>
                ) : (
                  <p className="px-1 text-sm text-muted-foreground">Sem nota</p>
                )}
              </div>

              <DrawerFooter className="gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <Button
                  type="button"
                  className="h-14 w-full gap-2 rounded-full text-base font-semibold"
                  onClick={() => onEdit(event)}
                >
                  <Pencil className="size-5" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-14 w-full gap-2 rounded-full text-base font-semibold"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-5" />
                  Excluir
                </Button>
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Drawer
        open={confirmOpen}
        onOpenChange={(next) => {
          if (deleting) return
          setConfirmOpen(next)
        }}
        showSwipeHandle
      >
        <DrawerContent className="mx-auto w-full max-w-[430px] rounded-t-[1.75rem] border-t">
          <DrawerHeader className="gap-1 px-5 pt-1 pb-2 text-left">
            <DrawerTitle className="text-xl font-semibold tracking-tight">
              Excluir evento?
            </DrawerTitle>
            <DrawerDescription className="text-left text-base">
              {event
                ? `“${event.title}” vai sumir da agenda. Não dá pra desfazer.`
                : "Esse evento vai sumir da agenda."}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              className="h-14 w-full gap-2 rounded-full text-base font-semibold"
              onClick={confirmDelete}
            >
              {deleting ? (
                <>
                  <Spinner data-icon="inline-start" className="size-5" />
                  Excluindo…
                </>
              ) : (
                <>
                  <Trash2 className="size-5" />
                  Sim, excluir
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={deleting}
              className="h-12 rounded-full text-base"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
