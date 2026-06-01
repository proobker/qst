"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { dismissLevelUpAction, getPendingLevelUpAction } from "@/app/actions/level-up";
import { LevelUpOverlayPortal } from "@/components/level-up-overlay";
import type { LevelUpCelebration } from "@/lib/level-up";

type LevelUpContextValue = {
  celebrate: (payload: LevelUpCelebration) => void;
};

const LevelUpContext = createContext<LevelUpContextValue | null>(null);

const POLL_MS = 6000;

type LevelUpProviderProps = {
  children: React.ReactNode;
  initialCelebration?: LevelUpCelebration | null;
};

export function LevelUpProvider({ children, initialCelebration = null }: LevelUpProviderProps) {
  const [celebration, setCelebration] = useState<LevelUpCelebration | null>(initialCelebration);
  const [pending, startTransition] = useTransition();
  const shownIds = useRef(new Set<string>());

  useEffect(() => {
    if (initialCelebration) {
      shownIds.current.add(initialCelebration.notificationId);
    }
  }, [initialCelebration]);

  const celebrate = useCallback((payload: LevelUpCelebration) => {
    if (shownIds.current.has(payload.notificationId)) {
      return;
    }
    shownIds.current.add(payload.notificationId);
    setCelebration(payload);
  }, []);

  const pollPending = useCallback(async () => {
    if (celebration || pending) {
      return;
    }
    try {
      const next = await getPendingLevelUpAction();
      if (next && !shownIds.current.has(next.notificationId)) {
        celebrate(next);
      }
    } catch {
      /* ignore polling errors */
    }
  }, [celebration, celebrate, pending]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void pollPending();
      }
    }, POLL_MS);
    return () => window.clearInterval(interval);
  }, [pollPending]);

  const handleDismiss = useCallback(() => {
    if (!celebration) {
      return;
    }
    const notificationId = celebration.notificationId;
    setCelebration(null);
    startTransition(async () => {
      try {
        const next = await dismissLevelUpAction(notificationId);
        if (next && !shownIds.current.has(next.notificationId)) {
          celebrate(next);
        }
      } catch {
        /* ignore */
      }
    });
  }, [celebration, celebrate]);

  return (
    <LevelUpContext.Provider value={{ celebrate }}>
      {children}
      <LevelUpOverlayPortal celebration={celebration} onDismiss={handleDismiss} />
    </LevelUpContext.Provider>
  );
}

export function useLevelUpCelebration() {
  const ctx = useContext(LevelUpContext);
  if (!ctx) {
    return { celebrate: () => {} };
  }
  return ctx;
}
