"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AuthScreen } from "@/components/auth-screen"
import { HomeScreen } from "@/components/home-screen"
import { SplashScreen } from "@/components/splash-screen"
import {
  clearSession,
  restoreSession,
  type AuthUser,
} from "@/lib/auth"

const ease = [0.22, 1, 0.36, 1] as const

type Phase = "splash" | "auth" | "app"

export function AppBoot() {
  const [phase, setPhase] = useState<Phase>("splash")
  const [user, setUser] = useState<AuthUser | null>(null)

  const finishSplash = useCallback(async () => {
    const session = await restoreSession()
    if (session) {
      setUser(session)
      setPhase("app")
      return
    }
    setPhase("auth")
  }, [])

  function handleAuth(next: AuthUser) {
    setUser(next)
    setPhase("app")
  }

  function handleLogout() {
    clearSession()
    setUser(null)
    setPhase("auth")
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "splash" && (
          <motion.div
            key="splash"
            className="min-h-dvh w-full"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.06,
              filter: "blur(6px)",
            }}
            transition={{ duration: 0.5, ease }}
          >
            <SplashScreen onDone={finishSplash} />
          </motion.div>
        )}

        {phase === "auth" && (
          <motion.div
            key="auth"
            className="min-h-dvh w-full"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease }}
          >
            <AuthScreen onAuth={handleAuth} />
          </motion.div>
        )}

        {phase === "app" && user && (
          <motion.div
            key="home"
            className="min-h-dvh w-full"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease }}
          >
            <HomeScreen user={user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
