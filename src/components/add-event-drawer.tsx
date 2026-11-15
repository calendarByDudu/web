"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import {
  EVENT_AUDIENCE_LABEL,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABEL,
  EVENT_COLORS,
  EVENT_SOFT_DOT,
  addMinutesToTime,
  createEvent,
  eventDayKey,
  updateEvent,
  type CalendarEvent,
  type EventAudience,
  type EventCategory,
} from "@/lib/events"
import { dayKey } from "@/lib/dates"
import { cn } from "@/lib/utils"

type AddEventDrawerProps = {
  open: boolean
  defaultDate: Date
  event?: CalendarEvent | null
  onOpenChange: (open: boolean) => void
  onSave: (event: CalendarEvent) => void
}

function defaultStartTime() {
  const now = new Date()
  const h = String((now.getHours() + 1) % 24).padStart(2, "0")
  return `${h}:00`
}

function timeFromIso(iso: string) {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

const fieldClass =
  "min-h-12 w-full rounded-2xl border-0 bg-secondary/80 px-4 py-3.5 text-base outline-none ring-0 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring dark:bg-secondary/60"

export function AddEventDrawer({
  open,
  defaultDate,
  event = null,
  onOpenChange,
  onSave,
}: AddEventDrawerProps) {
  const isEdit = Boolean(event)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(() => dayKey(defaultDate))
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState(defaultStartTime)
  const [endTime, setEndTime] = useState(() =>
    addMinutesToTime(defaultStartTime(), 60)
  )
  const [notes, setNotes] = useState("")
  const [audience, setAudience] = useState<EventAudience>("couple")
  const [category, setCategory] = useState<EventCategory>("saidinha")
  const [color, setColor] = useState<CalendarEvent["color"]>("blue")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setSaving(false)
      return
    }
    if (event) {
      setTitle(event.title)
      setDate(eventDayKey(event.startsAt))
      setAllDay(Boolean(event.allDay))
      setStartTime(timeFromIso(event.startsAt))
      setEndTime(
        event.endsAt
          ? timeFromIso(event.endsAt)
          : addMinutesToTime(timeFromIso(event.startsAt), 60)
      )
      setNotes(event.notes ?? "")
      setAudience(event.audience)
      setCategory(event.category)
      setColor(event.color)
      return
    }
    const start = defaultStartTime()
    setTitle("")
    setDate(dayKey(defaultDate))
    setAllDay(false)
    setStartTime(start)
    setEndTime(addMinutesToTime(start, 60))
    setNotes("")
    setAudience("couple")
    setCategory("saidinha")
    setColor("blue")
  }, [open, defaultDate, event])

  const canSave = Boolean(title.trim() && date)

  function warnRequired() {
    const missing: string[] = []
    if (!title.trim()) missing.push("título")
    if (!date) missing.push("data")
    toast.add({
      type: "warning",
      title: "Campos obrigatórios",
      description:
        missing.length === 0
          ? "Preencha os campos obrigatórios"
          : `Preencha: ${missing.join(" e ")}`,
      timeout: 3000,
    })
  }

  function handleStartChange(value: string) {
    setStartTime(value)
    if (value >= endTime) {
      setEndTime(addMinutesToTime(value, 60))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    if (!canSave) {
      warnRequired()
      return
    }
    if (!allDay && endTime <= startTime) {
      toast.add({
        type: "error",
        title: "Fim precisa ser depois do início",
        timeout: 3000,
      })
      return
    }
    setSaving(true)
    const form = {
      title,
      date,
      startTime,
      endTime,
      allDay,
      notes,
      audience,
      category,
      color,
    }
    try {
      const saved =
        isEdit && event
          ? await updateEvent(event.id, form, event)
          : await createEvent(form)
      onSave(saved)
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível salvar"
      toast.add({
        type: "error",
        title:
          message === "Failed to fetch"
            ? "Não foi possível salvar. Tente de novo."
            : message,
        timeout: 4000,
      })
    } finally {
      setSaving(false)
    }
  }

  function handleSaveClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!canSave) {
      e.preventDefault()
      warnRequired()
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (saving) return
        onOpenChange(next)
      }}
      showSwipeHandle
    >
      <DrawerContent
        className={cn(
          "mx-auto w-full max-w-[430px] rounded-t-[1.75rem] border-t",
          "data-[swipe-axis=y]:[--drawer-content-max-height:92dvh]"
        )}
      >
        <DrawerHeader className="gap-0 px-5 pt-1 pb-2 text-left">
          <DrawerTitle className="text-xl font-semibold tracking-tight">
            {isEdit ? "Editar evento" : "Novo evento"}
          </DrawerTitle>
        </DrawerHeader>

        <form
          id="add-event-form"
          onSubmit={handleSubmit}
          className="min-h-0 shrink"
        >
          {/* altura explícita: drawer cresce com conteúdo; flex-1 sozinho não trava o scroll */}
          <ScrollArea className="h-[calc(92dvh-12rem)] max-h-[calc(92dvh-12rem)]">
            <div className="flex flex-col gap-4 px-5 py-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Título <span className="text-destructive">*</span>
                </span>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Dentista"
                  aria-required
                  className={fieldClass}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Data <span className="text-destructive">*</span>
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-required
                  className={cn(fieldClass, "appearance-none")}
                />
              </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-muted-foreground">
              Categoria
            </legend>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((option) => {
                const selected = category === option
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCategory(option)}
                    className={cn(
                      "h-10 rounded-full px-3.5 text-sm font-medium transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/80 text-muted-foreground dark:bg-secondary/60"
                    )}
                  >
                    {EVENT_CATEGORY_LABEL[option]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-muted-foreground">
              Para quem
            </legend>
            <p className="text-xs text-muted-foreground">
              Vocês dois veem o evento. Isso só marca se é pessoal ou do casal.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/80 p-1 dark:bg-secondary/60">
              {(["me", "couple"] as const).map((option) => {
                const selected = audience === option
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAudience(option)}
                    className={cn(
                      "h-12 rounded-xl text-base font-medium transition-colors",
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
          </fieldset>

          <div className="flex min-h-14 items-center justify-between rounded-2xl bg-secondary/80 px-4 py-3 dark:bg-secondary/60">
            <div>
              <p className="text-base font-medium">Dia todo</p>
              <p className="text-sm text-muted-foreground">Sem horário</p>
            </div>
            <Switch
              checked={allDay}
              onCheckedChange={setAllDay}
            />
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Início
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className={cn(fieldClass, "appearance-none")}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Fim
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={cn(fieldClass, "appearance-none")}
                />
              </label>
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Nota
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              rows={3}
              className={cn(fieldClass, "resize-none")}
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-muted-foreground">
              Cor
            </legend>
            <div className="flex justify-between gap-2 py-1">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-11 rounded-full transition-transform active:scale-90",
                    EVENT_SOFT_DOT[c],
                    color === c
                      ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : "opacity-70"
                  )}
                />
              ))}
            </div>
          </fieldset>
            </div>
          </ScrollArea>
        </form>

        <DrawerFooter className="gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button
            type="submit"
            form="add-event-form"
            aria-disabled={!canSave || saving}
            disabled={saving}
            onClick={handleSaveClick}
            className={cn(
              "h-14 w-full gap-2 rounded-full text-base font-semibold",
              !canSave && !saving && "opacity-45"
            )}
          >
            {saving ? (
              <>
                <Spinner data-icon="inline-start" className="size-5" />
                {isEdit ? "Salvando…" : "Salvando…"}
              </>
            ) : isEdit ? (
              "Salvar alterações"
            ) : (
              "Salvar"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            className="h-12 rounded-full text-base"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
