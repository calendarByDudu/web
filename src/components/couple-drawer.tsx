"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Copy, Link2, Unlink, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import type { AuthUser } from "@/lib/auth"
import {
  acceptInviteCode,
  cancelInvite,
  createInviteCode,
  getPartner,
  getPendingInvite,
  unlinkCouple,
  type CouplePartner,
} from "@/lib/couple"
import type { CalendarEvent } from "@/lib/events"
import { cn } from "@/lib/utils"

type Mode = "menu" | "share" | "join" | "linked" | "unlink"

type CoupleDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthUser
  events: CalendarEvent[]
  onPartnerChange: (partner: CouplePartner | null) => void
}

export function CoupleDrawer({
  open,
  onOpenChange,
  user,
  events,
  onPartnerChange,
}: CoupleDrawerProps) {
  const [mode, setMode] = useState<Mode>("menu")
  const [partner, setPartner] = useState<CouplePartner | null>(null)
  const [code, setCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copyFlash, setCopyFlash] = useState(false)
  const copyFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stats = useMemo(() => {
    const total = events.length
    const together = events.filter((e) => e.audience === "couple").length
    const mine = events.filter((e) => e.audience === "me").length
    return { total, together, mine }
  }, [events])

  useEffect(() => {
    if (!open) {
      setCopyFlash(false)
      if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current)
      return
    }
    const linked = getPartner(user.email)
    setPartner(linked)
    setError(null)
    setJoinCode("")
    setBusy(false)
    if (linked) {
      setMode("linked")
      setCode("")
      return
    }
    const pending = getPendingInvite(user.email)
    if (pending) {
      setCode(pending.code)
      setMode("share")
      return
    }
    setCode("")
    setMode("menu")
  }, [open, user.email])

  useEffect(() => {
    return () => {
      if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current)
    }
  }, [])

  function syncPartner(next: CouplePartner | null) {
    setPartner(next)
    onPartnerChange(next)
  }

  function handleCreate() {
    setError(null)
    try {
      const next = createInviteCode(user)
      setCode(next)
      setMode("share")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar código")
    }
  }

  async function handleCopy() {
    const message = [
      `Oi amor 💛`,
      ``,
      `Quero te ter no nosso calendário.`,
      `Entra no calendarByDudu, cria sua conta e usa este código:`,
      ``,
      code,
      ``,
      `Aí a gente marca a vida junto. Te espero lá.`,
    ].join("\n")
    try {
      await navigator.clipboard.writeText(message)
      if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current)
      setCopyFlash(true)
      // Base UI pausa timeout se o toast nasce sob o cursor (hover). Fecha na mão.
      const toastId = toast.add({
        type: "success",
        title: "Copiado com sucesso",
        description: "Cole e mande pra pessoa amada",
        timeout: 3000,
        onClose: () => setCopyFlash(false),
      })
      copyFlashTimer.current = setTimeout(() => {
        setCopyFlash(false)
        toast.close(toastId)
      }, 3000)
    } catch {
      toast.add({
        type: "error",
        title: "Não deu pra copiar",
        timeout: 3000,
      })
    }
  }

  function handleCancelInvite() {
    cancelInvite(user.email)
    setCode("")
    setMode("menu")
  }

  function handleJoin() {
    if (busy || joinCode.length < 6) return
    setBusy(true)
    setError(null)
    try {
      const next = acceptInviteCode(joinCode, user)
      syncPartner(next)
      setMode("linked")
      toast.add({ title: `Vinculado com ${next.name}` })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Código inválido")
    } finally {
      setBusy(false)
    }
  }

  function handleUnlink() {
    unlinkCouple(user.email)
    syncPartner(null)
    setMode("menu")
    setCode("")
    toast.add({ title: "Vínculo removido" })
  }

  const title =
    mode === "share"
      ? "Seu código"
      : mode === "join"
        ? "Entrar com código"
        : mode === "linked" || mode === "unlink"
          ? "Casal"
          : "Convidar"

  const description =
    mode === "share"
      ? "Mande este código para a outra pessoa criar conta neste aparelho e digitar aqui."
      : mode === "join"
        ? "Digite o código de 6 caracteres que você recebeu."
        : mode === "linked"
          ? partner
            ? `Com ${partner.name}`
            : undefined
          : mode === "unlink"
            ? "Isso só remove o vínculo. Eventos ficam."
            : "Gere um código ou entre com o da outra pessoa."

  return (
    <>
      {copyFlash &&
        createPortal(
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[70] bg-black/25 backdrop-blur-sm transition-opacity duration-300"
          />,
          document.body
        )}
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto w-full max-w-[430px] rounded-t-[1.75rem] border-t data-[swipe-axis=y]:[--drawer-content-max-height:85dvh]">
        <DrawerHeader className="gap-1 px-5 pt-1 pb-2 text-left">
          <DrawerTitle className="text-xl font-semibold tracking-tight">
            {title}
          </DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
        </DrawerHeader>

        <div className="space-y-4 px-5 py-2">
          {mode === "menu" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-3 rounded-[1.25rem] border border-border bg-white px-4 py-4 text-left shadow-sm dark:bg-card"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Link2 className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    Gerar código
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Convide com um código único
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setJoinCode("")
                  setMode("join")
                }}
                className="flex w-full items-center gap-3 rounded-[1.25rem] border border-border bg-white px-4 py-4 text-left shadow-sm dark:bg-card"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Users className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    Tenho um código
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Entrar no vínculo existente
                  </span>
                </span>
              </button>
            </div>
          )}

          {mode === "share" && (
            <div className="space-y-3">
              <div className="rounded-[1.5rem] border border-border bg-secondary/40 px-4 py-6 text-center">
                <p className="text-3xl font-semibold tracking-[0.35em] tabular-nums">
                  {code}
                </p>
              </div>
            </div>
          )}

          {mode === "join" && (
            <div className="flex flex-col items-center gap-3">
              <InputOTP
                maxLength={6}
                value={joinCode}
                onChange={(value) => {
                  setJoinCode(value.toUpperCase())
                  setError(null)
                }}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} aria-invalid={!!error || undefined} />
                  <InputOTPSlot index={1} aria-invalid={!!error || undefined} />
                  <InputOTPSlot index={2} aria-invalid={!!error || undefined} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} aria-invalid={!!error || undefined} />
                  <InputOTPSlot index={4} aria-invalid={!!error || undefined} />
                  <InputOTPSlot index={5} aria-invalid={!!error || undefined} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}

          {(mode === "linked" || mode === "unlink") && partner && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-border bg-white px-4 py-4 shadow-sm dark:bg-card">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold">
                  {partner.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {partner.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {partner.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["Criados", stats.total],
                    ["Juntos", stats.together],
                    ["Só você", stats.mine],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[1.25rem] border border-border bg-white px-3 py-3 text-center shadow-sm dark:bg-card"
                  >
                    <p className="text-xl font-semibold tabular-nums">
                      {value}
                    </p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <DrawerFooter className="gap-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {mode === "share" && (
            <>
              <Button
                type="button"
                className="h-12 rounded-2xl text-base"
                onClick={handleCopy}
              >
                <Copy className="size-5" />
                Copiar código
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl text-base"
                onClick={handleCancelInvite}
              >
                Cancelar convite
              </Button>
            </>
          )}

          {mode === "join" && (
            <>
              <Button
                type="button"
                className="h-12 rounded-2xl text-base"
                disabled={busy || joinCode.length < 6}
                onClick={handleJoin}
              >
                {busy ? <Spinner className="size-5" /> : "Vincular"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl text-base"
                onClick={() => {
                  setError(null)
                  setMode("menu")
                }}
              >
                Voltar
              </Button>
            </>
          )}

          {mode === "linked" && (
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-12 rounded-2xl text-base text-destructive hover:text-destructive"
              )}
              onClick={() => setMode("unlink")}
            >
              <Unlink className="size-5" />
              Remover vínculo
            </Button>
          )}

          {mode === "unlink" && (
            <>
              <Button
                type="button"
                variant="destructive"
                className="h-12 rounded-2xl text-base"
                onClick={handleUnlink}
              >
                Confirmar remoção
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl text-base"
                onClick={() => setMode("linked")}
              >
                Voltar
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    </>
  )
}
