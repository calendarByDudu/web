"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HomeScreen } from "@/components/home-screen"
import { SplashScreen } from "@/components/splash-screen"

const ease = [0.22, 1, 0.36, 1] as const

export function AppBoot() {
  const [ready, setReady] = useState(false)
  const finish = useCallback(() => setReady(true), [])

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {!ready ? (
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
            <SplashScreen onDone={finish} />
          </motion.div>
        ) : (
          <motion.div
            key="home"
            className="min-h-dvh w-full"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease }}
          >
            <HomeScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
