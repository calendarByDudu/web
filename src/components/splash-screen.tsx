"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Progress } from "@/components/ui/progress"

type SplashScreenProps = {
  onDone: () => void
  /** Total splash duration in ms */
  durationMs?: number
}

const ease = [0.22, 1, 0.36, 1] as const

export function SplashScreen({
  onDone,
  durationMs = 1800,
}: SplashScreenProps) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let frame = 0
    let done = false

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - t) ** 2
      setValue(Math.round(eased * 100))
      if (t < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      if (!done) {
        done = true
        onDone()
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [durationMs, onDone])

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-8 bg-background px-10">
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease }}
      >
        <motion.img
          src="/logo.svg"
          alt="calendarByDudu"
          width={96}
          height={96}
          className="size-24 dark:invert"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.p
          className="text-sm font-medium tracking-tight text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          calendarByDudu
        </motion.p>
      </motion.div>

      <motion.div
        className="w-full max-w-[200px] space-y-2 [&_[data-slot=progress-track]]:h-1.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease }}
      >
        <Progress value={value} className="w-full" />
        <p className="text-center text-xs tabular-nums text-muted-foreground">
          {value}%
        </p>
      </motion.div>
    </div>
  )
}
