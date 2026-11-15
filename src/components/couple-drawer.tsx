"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
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
  getCouple,
  unlinkCouple,
  type CouplePartner,
  type CoupleStats,
} from "@/lib/couple"
import type { CalendarEvent } from "@/lib/events"
import { cn } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1] as const

const modeVariants = {
  enter: (d: number) => ({ opacity: 0, x: 20 * d }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: -20 * d }),
}

type Mode = "menu" | "share" | "join" | "linked" | "unlink"

type CoupleDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthUser
  events: CalendarEvent[]
  initialPartner?: CouplePartner | null
  initialStats?: CoupleStats | null
  onPartnerChange: (partner: CouplePartner | null) => void
  onStatsChange?: (stats: CoupleStats | null) => void
}

export function CoupleDrawer({
  open,
  onOpenChange,
  user,
  events,
  initialPartner = null,
  initialStats = null,
  onPartnerChange,
  onStatsChange,
}: CoupleDrawerProps) {
  const [mode, setMode] = useState<Mode>("menu")
  const [dir, setDir] = useState(1)
  const [partner, setPartner] = useState<CouplePartner | null>(null)
  const [code, setCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiStats, setApiStats] = useState<CoupleStats | null>(null)
  const [copyFlash, setCopyFlash] = useState(false)
  const copyFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function navigate(next: Mode, direction: 1 | -1 = 1) {
    setDir(direction)
    setMode(next)
  }

  const localStats = useMemo(() => {
    const total = events.length
    const together = events.filter((e) => e.audience === "couple").length
    const mine = events.filter((e) => e.audience === "me").length
    return { total, together, mine }
  }, [events])

  const stats = apiStats ?? localStats

  useEffect(() => {
    if (!open) {
      setCopyFlash(false)
      if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current)
      return
    }

    setJoinCode("")
    setBusy(false)
    setCode("")

    // Já veio do /couple na home: mostra casal sem novo request.
    if (initialPartner) {
      setPartner(initialPartner)
      setApiStats(initialStats)
      setMode("linked")
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    ;(async () => {
      try {
        const status = await getCouple(user.id)
        if (cancelled) return
        setPartner(status.partner)
        setApiStats(status.stats ?? null)
        onPartnerChange(status.partner)
        onStatsChange?.(status.stats ?? null)
        if (status.linked && status.partner) {
          setMode("linked")
          return
        }
        if (status.pendingInvite) {
          setCode(status.pendingInvite.code)
          setMode("share")
          return
        }
        setMode("menu")
      } catch (e) {
        if (cancelled) return
        setMode("menu")
        toast.add({
          type: "error",
          title:
            e instanceof Error
              ? e.message
              : "Não foi possível carregar o casal",
          timeout: 4000,
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // Só no open: seed do cache da home; muda partner com drawer aberto não re-dispara.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open edge
  }, [open])

  useEffect(() => {
    return () => {
      if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current)
    }
  }, [])

  function syncPartner(
    next: CouplePartner | null,
    nextStats?: CoupleStats | null
  ) {
    setPartner(next)
    onPartnerChange(next)
    if (nextStats !== undefined) {
      setApiStats(nextStats)
      onStatsChange?.(nextStats)
    } else if (!next) {
      setApiStats(null)
      onStatsChange?.(null)
    }
  }

  async function handleCreate() {
    if (busy) return
    setBusy(true)
    try {
      const invite = await createInviteCode()
      setCode(invite.code)
      navigate("share")
    } catch (e) {
      toast.add({
        type: "error",
        title: e instanceof Error ? e.message : "Erro ao gerar código",
        timeout: 4000,
      })
    } finally {
      setBusy(false)
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

  async function handleCancelInvite() {
    if (busy) return
    setBusy(true)
    try {
      await cancelInvite()
      setCode("")
      navigate("menu", -1)
    } catch (e) {
      toast.add({
        type: "error",
        title: e instanceof Error ? e.message : "Erro ao cancelar",
        timeout: 4000,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin() {
    if (busy || joinCode.length < 6) return
    setBusy(true)
    try {
      const status = await acceptInviteCode(joinCode, user.id)
      const next = status.partner
      if (!next) throw new Error("Vínculo sem parceiro")
      syncPartner(next, status.stats ?? null)
      navigate("linked")
      toast.add({ title: `Vinculado com ${next.name}` })
    } catch (e) {
      toast.add({
        type: "error",
        title: e instanceof Error ? e.message : "Código inválido",
        timeout: 4000,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleUnlink() {
    if (busy) return
    setBusy(true)
    try {
      await unlinkCouple()
      syncPartner(null, null)
      navigate("menu", -1)
      setCode("")
      toast.add({ title: "Vínculo removido" })
    } catch (e) {
      toast.add({
        type: "error",
        title: e instanceof Error ? e.message : "Erro ao remover vínculo",
        timeout: 4000,
      })
    } finally {
      setBusy(false)
    }
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
      ? "Mande este código para a outra pessoa criar conta e digitar no app."
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
        <DrawerContent className="mx-auto w-full max-w-[430px] overflow-hidden rounded-t-[1.75rem] border-t data-[swipe-axis=y]:[--drawer-content-max-height:85dvh]">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-6" />
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={mode}
                custom={dir}
                variants={modeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease }}
                className="flex min-h-0 flex-col"
              >
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
                        disabled={busy}
                        className="flex w-full items-center gap-3 rounded-[1.25rem] border border-border bg-white px-4 py-4 text-left shadow-sm dark:bg-card disabled:opacity-60"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                          {busy ? (
                            <Spinner className="size-5" />
                          ) : (
                            <Link2 className="size-5" />
                          )}
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
                          setJoinCode("")
                          navigate("join")
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
                        }}
                        containerClassName="justify-center"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
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
                            <p className="text-xs text-muted-foreground">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                        disabled={busy}
                        onClick={handleCancelInvite}
                      >
                        {busy ? (
                          <Spinner className="size-5" />
                        ) : (
                          "Cancelar convite"
                        )}
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
                        onClick={() => navigate("menu", -1)}
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
                      onClick={() => navigate("unlink")}
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
                        disabled={busy}
                        onClick={handleUnlink}
                      >
                        {busy ? (
                          <Spinner className="size-5" />
                        ) : (
                          "Confirmar remoção"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 rounded-2xl text-base"
                        disabled={busy}
                        onClick={() => navigate("linked", -1)}
                      >
                        Voltar
                      </Button>
                    </>
                  )}
                </DrawerFooter>
              </motion.div>
            </AnimatePresence>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
