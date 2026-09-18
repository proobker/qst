"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useOfflineStatus } from "@/hooks/use-offline-status";

const SIGNAL_BARS = [0.15, 0.45, 0.2, 0.6, 0.35, 1];

export function OfflineScreen() {
  const { isOnline, isChecking, retry } = useOfflineStatus();

  return (
    <AnimatePresence>
      {!isOnline ? (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="alert"
          aria-live="assertive"
        >
          <motion.div className="absolute inset-0 bg-background/90 backdrop-blur-md" />

          <motion.div
            className="relative z-10 flex w-full max-w-sm flex-col items-center text-center"
            initial={{ scale: 0.9, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="relative mb-8 flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-3xl"
                animate={{ scale: [0.8, 1.2, 0.95], opacity: [0.15, 0.45, 0.25] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatType: "reverse" }}
              />

              {[0, 1].map((index) => (
                <motion.div
                  key={index}
                  className="pointer-events-none absolute h-32 w-32 rounded-full border-2 border-primary/30"
                  initial={{ scale: 0.5, opacity: 0.7 }}
                  animate={{ scale: [0.5, 1.4], opacity: [0.7, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: index * 0.9,
                    ease: "easeOut",
                  }}
                />
              ))}

              {[0, 90, 180, 270].map((rotation) => (
                <motion.div
                  key={rotation}
                  className="pointer-events-none absolute h-40 w-40 rounded-full"
                  style={{ rotate: rotation }}
                  animate={{ rotate: rotation + 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                >
                  <div
                    className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent, var(--primary) 30%, transparent)",
                    }}
                  />
                </motion.div>
              ))}

              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface shadow-2xl ring-1 ring-border">
                <WifiOff className="h-10 w-10 text-primary" />
              </div>

              <div className="absolute -bottom-1 flex items-end gap-1 rounded-full bg-surface px-2 pb-1.5 shadow-lg ring-1 ring-border">
                {SIGNAL_BARS.map((heightRatio, index) => (
                  <motion.span
                    key={index}
                    className="w-1 rounded-sm bg-primary"
                    style={{ height: 4 + heightRatio * 10 }}
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: index * 0.12,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>

            <motion.p
              className="text-xs font-bold uppercase tracking-[0.35em] text-primary"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              Quest interrupted
            </motion.p>

            <motion.h1
              className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              Connection Lost
            </motion.h1>

            <motion.p
              className="mt-2 max-w-xs text-sm text-muted"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              Your next quest is waiting. Reconnect to continue the adventure.
            </motion.p>

            <motion.div
              className="mt-8 w-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                <div className="connecting-bar h-full w-1/3 rounded-full bg-primary" />
              </div>
              <p className="mt-3 text-xs tabular-nums text-muted" aria-live="polite">
                {isChecking ? "Checking connection..." : "Waiting for connection..."}
              </p>
            </motion.div>

            <motion.button
              type="button"
              onClick={() => void retry()}
              disabled={isChecking}
              className="mt-6 rounded-full bg-gradient-primary px-8 py-3 text-sm font-bold text-background shadow-lg disabled:opacity-60"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              whileTap={{ scale: 0.96 }}
            >
              {isChecking ? "Checking..." : "Try again"}
            </motion.button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}