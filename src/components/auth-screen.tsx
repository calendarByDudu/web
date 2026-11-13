"use client"

import { useState } from "react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import {
  login,
  requestPasswordReset,
  resetPassword,
  signup,
  verifyResetCode,
  type AuthUser,
} from "@/lib/auth"
import { cn } from "@/lib/utils"

type AuthMode = "login" | "signup" | "forgot" | "otp" | "reset"

type AuthScreenProps = {
  onAuth: (user: AuthUser) => void
}

const fieldClass =
  "min-h-12 w-full rounded-2xl border-0 bg-secondary/80 px-4 py-3.5 text-base outline-none ring-0 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring dark:bg-secondary/60"

const titles: Record<AuthMode, { title: string; sub: string }> = {
  login: {
    title: "Entrar",
    sub: "Acesse sua agenda de casal",
  },
  signup: {
    title: "Criar conta",
    sub: "Comece a organizar os dois",
  },
  forgot: {
    title: "Esqueci a senha",
    sub: "Digite o e-mail da sua conta",
  },
  otp: {
    title: "Código do e-mail",
    sub: "Digite o código de 6 dígitos",
  },
  reset: {
    title: "Nova senha",
    sub: "Escolha uma senha nova",
  },
}

export function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [busy, setBusy] = useState(false)
  const [otpInvalid, setOtpInvalid] = useState(false)

  const copy = titles[mode]

  function showError(err: unknown) {
    toast.add({
      title: err instanceof Error ? err.message : "Algo deu errado",
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setOtpInvalid(false)
    setBusy(true)
    await new Promise((r) => setTimeout(r, 450))
    try {
      if (mode === "login") {
        onAuth(login(email, password))
        toast.add({ title: "Bem-vindo de volta" })
        return
      }
      if (mode === "signup") {
        onAuth(signup(name, email, password))
        toast.add({ title: "Conta criada" })
        return
      }
      if (mode === "forgot") {
        requestPasswordReset(email)
        toast.add({ title: "Código enviado" })
        setOtp("")
        setMode("otp")
        return
      }
      if (mode === "otp") {
        verifyResetCode(email, otp)
        setPassword("")
        setMode("reset")
        return
      }
      resetPassword(email, password)
      toast.add({ title: "Senha atualizada" })
      setMode("login")
      setPassword("")
      setOtp("")
    } catch (err) {
      if (mode === "otp") setOtpInvalid(true)
      showError(err)
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next)
    setOtpInvalid(false)
    setPassword("")
    setOtp("")
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mb-8 flex flex-col items-center text-center">
        <img
          src="/logo.svg"
          alt=""
          width={56}
          height={56}
          className="mb-4 size-14 dark:invert"
        />
        <p className="text-xs font-medium text-muted-foreground">
          calendarByDudu
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {copy.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "otp" ? (
            <>
              Enviado para{" "}
              <span className="font-medium text-foreground">{email}</span>
            </>
          ) : (
            copy.sub
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-3">
        {mode === "signup" && (
          <label className="block space-y-1.5">
            <span className="px-1 text-sm font-medium">Nome</span>
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Como te chamam"
              required
            />
          </label>
        )}

        {(mode === "login" || mode === "signup" || mode === "forgot") && (
          <label className="block space-y-1.5">
            <span className="px-1 text-sm font-medium">E-mail</span>
            <input
              type="email"
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="voce@email.com"
              required
            />
          </label>
        )}

        {(mode === "login" || mode === "signup" || mode === "reset") && (
          <label className="block space-y-1.5">
            <span className="px-1 text-sm font-medium">
              {mode === "reset" ? "Nova senha" : "Senha"}
            </span>
            <input
              type="password"
              className={fieldClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder={
                mode === "login" ? "••••••••" : "Mínimo 4 caracteres"
              }
              required
              minLength={mode === "login" ? undefined : 4}
            />
          </label>
        )}

        {mode === "otp" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otp}
              onChange={(value) => {
                setOtp(value)
                setOtpInvalid(false)
              }}
              containerClassName="justify-center gap-2"
              aria-invalid={otpInvalid || undefined}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} aria-invalid={otpInvalid || undefined} />
                <InputOTPSlot index={1} aria-invalid={otpInvalid || undefined} />
                <InputOTPSlot index={2} aria-invalid={otpInvalid || undefined} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} aria-invalid={otpInvalid || undefined} />
                <InputOTPSlot index={4} aria-invalid={otpInvalid || undefined} />
                <InputOTPSlot index={5} aria-invalid={otpInvalid || undefined} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-muted-foreground">Demo: use 123456</p>
          </div>
        )}

        {mode === "login" && (
          <div className="flex justify-end px-1">
            <button
              type="button"
              className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              onClick={() => switchMode("forgot")}
            >
              Esqueci a senha
            </button>
          </div>
        )}

        <Button
          type="submit"
          className="mt-2 h-12 w-full rounded-2xl text-base"
          disabled={busy || (mode === "otp" && otp.length < 6)}
        >
          {busy ? (
            <Spinner className="size-5" />
          ) : mode === "login" ? (
            "Entrar"
          ) : mode === "signup" ? (
            "Criar conta"
          ) : mode === "forgot" ? (
            "Enviar código"
          ) : mode === "otp" ? (
            "Confirmar"
          ) : (
            "Salvar senha"
          )}
        </Button>
      </form>

      <div className="mx-auto mt-auto w-full max-w-sm pt-8 text-center text-sm text-muted-foreground">
        {mode === "login" && (
          <p>
            Não tem conta?{" "}
            <button
              type="button"
              className={cn(
                "font-medium text-foreground underline-offset-2 hover:underline"
              )}
              onClick={() => switchMode("signup")}
            >
              Cadastre-se
            </button>
          </p>
        )}
        {mode === "signup" && (
          <p>
            Já tem conta?{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-2 hover:underline"
              onClick={() => switchMode("login")}
            >
              Entrar
            </button>
          </p>
        )}
        {(mode === "forgot" || mode === "otp" || mode === "reset") && (
          <p>
            {mode === "otp" ? (
              <>
                Não chegou?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={() => {
                    try {
                      requestPasswordReset(email)
                      setOtp("")
                      setOtpInvalid(false)
                      toast.add({ title: "Código reenviado" })
                    } catch (err) {
                      showError(err)
                    }
                  }}
                >
                  Reenviar
                </button>
                {" · "}
              </>
            ) : null}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-2 hover:underline"
              onClick={() => switchMode("login")}
            >
              Voltar ao login
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
