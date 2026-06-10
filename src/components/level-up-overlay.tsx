"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { LevelUpCelebration } from "@/lib/level-up";
import { rarityAccentColor } from "@/lib/level-up";

type LevelUpOverlayProps = {
  celebration: LevelUpCelebration;
  onDismiss: () => void;
};

const PLAY_GREEN = "#3ddc84";

function particleValue(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function ConfettiBurst({ accent }: { accent: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => ({
        id: index,
        angle: (index / 48) * Math.PI * 2 + particleValue(index, 1) * 0.4,
        distance: 90 + particleValue(index, 2) * 160,
        size: 4 + particleValue(index, 3) * 8,
        delay: particleValue(index, 4) * 0.15,
        color: index % 3 === 0 ? PLAY_GREEN : index % 3 === 1 ? accent : "#fbbf24",
      })),
    [accent],
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-sm"
          style={{
            width: particle.size,
            height: particle.size * (particle.id % 2 === 0 ? 0.55 : 1),
            backgroundColor: particle.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: Math.cos(particle.angle) * particle.distance,
            y: Math.sin(particle.angle) * particle.distance,
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.6],
            rotate: particle.angle * (180 / Math.PI),
          }}
          transition={{
            duration: 1.1,
            delay: 0.35 + particle.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}

function AnimatedLevelNumber({
  from,
  to,
  accent,
}: {
  from: number;
  to: number;
  accent: string;
}) {
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (from === to) {
      return;
    }
    const steps = Math.min(to - from, 12);
    const increment = Math.max(1, Math.ceil((to - from) / steps));
    let current = from;
    const timer = window.setInterval(() => {
      current = Math.min(current + increment, to);
      setDisplay(current);
      if (current >= to) {
        window.clearInterval(timer);
      }
    }, 70);
    return () => window.clearInterval(timer);
  }, [from, to]);

  const displayValue = from === to ? to : display;

  return (
    <motion.span
      key={displayValue}
      initial={{ scale: 0.6, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className="text-7xl font-black tabular-nums tracking-tight text-white drop-shadow-lg sm:text-8xl"
      style={{ textShadow: `0 0 40px ${accent}88` }}
    >
      {displayValue}
    </motion.span>
  );
}

export function LevelUpOverlay({ celebration, onDismiss }: LevelUpOverlayProps) {
  const accent = rarityAccentColor(celebration.rarity);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
    >
      <motion.button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onDismiss}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        aria-label="Dismiss level up"
      />

      <motion.div
        className="relative z-10 flex w-full max-w-sm flex-col items-center text-center"
        initial={{ scale: 0.85, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.05 }}
        onClick={(event) => event.stopPropagation()}
      >
        <ConfettiBurst accent={accent} />

        <motion.div
          className="pointer-events-none absolute h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
          animate={{ scale: [0.8, 1.15, 1], opacity: [0.2, 0.45, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        />

        {[0, 45, 90, 135].map((rotation) => (
          <motion.div
            key={rotation}
            className="pointer-events-none absolute h-80 w-80"
            style={{ rotate: rotation }}
            animate={{ rotate: rotation + 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            <div
              className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
              style={{
                background: `linear-gradient(to bottom, transparent, ${PLAY_GREEN}44, transparent)`,
              }}
            />
          </motion.div>
        ))}

        <motion.p
          id="level-up-title"
          className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.35em] text-[#3ddc84]"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Sparkles size={14} />
          Level up
          <Sparkles size={14} />
        </motion.p>

        <motion.div
          className="relative mb-6 flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full border-4"
            style={{ borderColor: `${accent}55` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
            <motion.circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={PLAY_GREEN}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="289"
              initial={{ strokeDashoffset: 289 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.2, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div
            className="flex h-36 w-36 flex-col items-center justify-center rounded-full sm:h-40 sm:w-40"
            style={{
              background: `radial-gradient(circle at 30% 25%, ${accent}33, #0f172a 55%, #020617 100%)`,
              boxShadow: `0 0 60px ${accent}55, inset 0 0 30px ${PLAY_GREEN}22`,
            }}
          >
            <AnimatedLevelNumber
              from={celebration.previousLevel}
              to={celebration.level}
              accent={accent}
            />
          </div>
          <motion.div
            className="absolute -bottom-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background"
            style={{ backgroundColor: PLAY_GREEN }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 400, damping: 20 }}
          >
            +{celebration.level - celebration.previousLevel} level
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="space-y-2 px-2"
        >
          <p className="text-lg font-semibold text-foreground sm:text-xl">{celebration.displayName}</p>
          <p className="text-sm text-muted">
            {celebration.rarity} · {celebration.title} {celebration.rank}
          </p>
        </motion.div>

        <motion.button
          type="button"
          onClick={onDismiss}
          className="mt-8 rounded-full px-8 py-3 text-sm font-bold text-background shadow-lg transition hover:brightness-110"
          style={{ backgroundColor: PLAY_GREEN }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          whileTap={{ scale: 0.96 }}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export function LevelUpOverlayPortal({
  celebration,
  onDismiss,
}: {
  celebration: LevelUpCelebration | null;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {celebration ? (
        <LevelUpOverlay key={celebration.notificationId} celebration={celebration} onDismiss={onDismiss} />
      ) : null}
    </AnimatePresence>
  );
}
