"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Check, X } from "lucide-react";
import { swipeLeftAction, swipeRightAction } from "@/app/actions/quests";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type QuestData = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  xp_reward: number;
  estimated_time: string;
  category: string;
  badge_reward: string | null;
};

export type QuestStackEntry = {
  userQuestId: string;
  quest: QuestData;
};

type PendingSwipe = {
  entry: QuestStackEntry;
  direction: "left" | "right";
  animationDone: boolean;
  saveDone: boolean;
  saveError: string | null;
  successMessage: string | null;
};

type QuestSwipeDeckProps = {
  quests: QuestStackEntry[];
  loadingReason: string;
};

const SWIPE_THRESHOLD = 110;
const SWIPE_VELOCITY_THRESHOLD = 700;
const SWIPE_FEEDBACK_DELAY_MS = 120;
const SNAP_BACK_TRANSITION = { type: "spring", stiffness: 420, damping: 34 } as const;
const EXIT_TRANSITION = {
  type: "spring",
  stiffness: 190,
  damping: 25,
  mass: 0.9,
} as const;

function QuestCardPreview({ quest, className }: { quest: QuestData; className?: string }) {
  return (
    <div className={cn("glass-card flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl p-6", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
          {quest.category}
        </span>
        <span className="rounded-full border border-border px-2 py-1">{quest.difficulty}</span>
      </div>
      <h2 className="text-lg font-bold tracking-tight text-foreground">{quest.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm text-muted">{quest.description}</p>
    </div>
  );
}

function ActiveQuestCard({
  entry,
  exitDirection,
  onCommitSwipe,
  onExitComplete,
}: {
  entry: QuestStackEntry;
  exitDirection: "left" | "right" | null;
  onCommitSwipe: (direction: "left" | "right") => void;
  onExitComplete: () => void;
}) {
  const { quest } = entry;
  const [dragX, setDragX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-16, 0, 16]);
  const acceptOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const rejectOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);
  const isAnimatingExitRef = useRef(false);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const hasEnoughDistance = Math.abs(info.offset.x) > SWIPE_THRESHOLD;
    const hasEnoughVelocity =
      Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD && Math.abs(info.offset.x) > 35;

    if (hasEnoughDistance || hasEnoughVelocity) {
      onCommitSwipe(info.offset.x > 0 || info.velocity.x > 0 ? "right" : "left");
      return;
    }

    setDragX(0);
    void animate(x, 0, SNAP_BACK_TRANSITION);
  }

  useEffect(() => {
    if (!exitDirection || isAnimatingExitRef.current) {
      return;
    }

    isAnimatingExitRef.current = true;
    setDragX(0);

    const viewportWidth = typeof window === "undefined" ? 520 : window.innerWidth;
    const directionMultiplier = exitDirection === "right" ? 1 : -1;
    const exitX = directionMultiplier * Math.max(viewportWidth * 1.25, 540);
    const timeout = window.setTimeout(() => {
      void animate(x, exitX, {
        ...EXIT_TRANSITION,
        velocity: directionMultiplier * 760,
      }).then(onExitComplete, onExitComplete);
    }, SWIPE_FEEDBACK_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [exitDirection, onExitComplete, x]);

  useEffect(() => {
    if (exitDirection) {
      return;
    }

    isAnimatingExitRef.current = false;
    void animate(x, 0, SNAP_BACK_TRANSITION);
  }, [entry.userQuestId, exitDirection, x]);

  return (
    <motion.article
      key={entry.userQuestId}
      drag={exitDirection ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.92}
      dragMomentum={false}
      style={{ x, rotate }}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "glass-card quest-swipe-card relative z-10 flex min-h-[420px] cursor-grab touch-none select-none flex-col rounded-2xl p-6 active:cursor-grabbing",
        exitDirection && "pointer-events-none",
      )}
      role="group"
      aria-label={`Quest card: ${quest.title}. Swipe right to accept, left to reject.`}
    >
      <motion.div
        style={{ opacity: exitDirection === "right" ? 1 : acceptOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-4 border-success bg-success/20 text-success"
      >
        <div className="-rotate-12 flex items-center gap-3 text-4xl font-black uppercase">
          <Check size={48} />
          Accept
        </div>
      </motion.div>

      <motion.div
        style={{ opacity: exitDirection === "left" ? 1 : rejectOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-4 border-red-400 bg-red-500/20 text-red-400"
      >
        <div className="rotate-12 flex items-center gap-3 text-4xl font-black uppercase">
          <X size={48} />
          Reject
        </div>
      </motion.div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
          {quest.category}
        </span>
        <span className="rounded-full border border-border px-2 py-1">{quest.difficulty}</span>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-accent">
          {quest.xp_reward} XP
        </span>
        <span className="rounded-full border border-border px-2 py-1">{quest.estimated_time}</span>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-gradient-subtle">{quest.title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-muted">{quest.description}</p>
      {quest.badge_reward ? (
        <p className="mt-3 text-sm text-muted">
          Badge reward: <span className="font-semibold text-accent">{quest.badge_reward}</span>
        </p>
      ) : null}

      <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
        <button
          type="button"
          onClick={() => onCommitSwipe("left")}
          className="rounded-lg border border-border px-4 py-3 text-sm font-semibold text-muted transition hover:border-red-400 hover:text-red-400"
          aria-label="Reject quest"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => onCommitSwipe("right")}
          className="btn-primary w-full py-3"
          aria-label="Accept quest"
        >
          Accept
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Swipe or use left/right arrow keys
        {dragX !== 0 ? ` - ${Math.abs(Math.round(dragX))}px` : ""}
      </p>
    </motion.article>
  );
}

export function QuestSwipeDeck({ quests, loadingReason }: QuestSwipeDeckProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deck, setDeck] = useState(quests);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [emptyRefreshes, setEmptyRefreshes] = useState(0);
  const pendingSwipeRef = useRef<PendingSwipe | null>(null);

  const active = deck[0];
  const backOne = deck[1];
  const backTwo = deck[2];

  const finishPendingSwipe = useCallback(() => {
    const pending = pendingSwipeRef.current;
    if (!pending || !pending.animationDone || !pending.saveDone) {
      return;
    }

    pendingSwipeRef.current = null;

    if (pending.saveError) {
      toast(pending.saveError, "error");
      setExitDirection(null);
      return;
    }

    setDeck((prev) => prev.filter((entry) => entry.userQuestId !== pending.entry.userQuestId));
    setExitDirection(null);
    router.refresh();

    if (pending.successMessage) {
      toast(pending.successMessage, "success");
    }
  }, [router, toast]);

  const commitSwipe = useCallback((direction: "left" | "right") => {
    if (exitDirection || !active || pendingSwipeRef.current) {
      return;
    }

    const pending: PendingSwipe = {
      entry: active,
      direction,
      animationDone: false,
      saveDone: false,
      saveError: null,
      successMessage: null,
    };

    pendingSwipeRef.current = pending;
    setEmptyRefreshes(0);
    setExitDirection(direction);

    void (async () => {
      try {
        if (pending.direction === "right") {
          await swipeRightAction(pending.entry.userQuestId);
          pending.successMessage = "Quest accepted - view it anytime on Quests.";
        } else {
          await swipeLeftAction(pending.entry.userQuestId);
        }
      } catch (err) {
        pending.saveError = err instanceof Error ? err.message : "Something went wrong.";
      } finally {
        pending.saveDone = true;
        finishPendingSwipe();
      }
    });
  }, [active, exitDirection, finishPendingSwipe]);

  const handleExitComplete = useCallback(() => {
    const pending = pendingSwipeRef.current;
    if (!pending) {
      return;
    }

    pending.animationDone = true;
    finishPendingSwipe();
  }, [finishPendingSwipe]);

  useEffect(() => {
    if (deck.length > 0 || exitDirection) {
      return;
    }

    const refresh = () => {
      setEmptyRefreshes((count) => count + 1);
      router.refresh();
    };
    const firstRetry = window.setTimeout(refresh, 900);
    const retryInterval = window.setInterval(refresh, 3_000);

    return () => {
      window.clearTimeout(firstRetry);
      window.clearInterval(retryInterval);
    };
  }, [deck.length, exitDirection, router]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (exitDirection) {
        return;
      }
      if (e.key === "ArrowRight") {
        commitSwipe("right");
      } else if (e.key === "ArrowLeft") {
        commitSwipe("left");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commitSwipe, exitDirection]);

  if (deck.length === 0) {
    const takingLong = emptyRefreshes >= 4;

    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Spinner label="Loading next quests..." />
        <p className="max-w-xs text-sm text-muted">
          {takingLong
            ? "Still building quests. The local builder should recover this; try another refresh if it stays stuck."
            : loadingReason}
        </p>
        {takingLong ? (
          <button
            type="button"
            onClick={() => {
              setEmptyRefreshes(0);
              router.refresh();
            }}
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary"
          >
            Try local quests again
          </button>
        ) : null}
      </div>
    );
  }

  if (!active) {
    return null;
  }

  const showStack = !exitDirection;

  return (
    <div className="mx-auto w-full max-w-md">
      {deck.length > 1 ? (
        <p className="mb-2 text-center text-xs text-muted">{deck.length - 1} more in stack</p>
      ) : null}

      <div className="relative">
        {backTwo ? (
          <div
            className={cn(
              "absolute inset-x-3 bottom-0 top-3 z-0 transition-opacity duration-200",
              showStack ? "opacity-100" : "opacity-0",
            )}
            aria-hidden="true"
          >
            <QuestCardPreview
              quest={backTwo.quest}
              className="pointer-events-none scale-[0.96] bg-surface-solid"
            />
          </div>
        ) : (
          <div
            className={cn(
              "absolute inset-x-3 bottom-0 top-3 z-0 min-h-[420px] rounded-2xl border border-border/60 bg-surface-solid transition-opacity duration-200",
              showStack ? "opacity-100" : "opacity-0",
            )}
            aria-hidden="true"
          />
        )}

        {backOne ? (
          <div
            className={cn(
              "absolute inset-x-1.5 bottom-0 top-1.5 z-0 transition-opacity duration-200",
              showStack ? "opacity-100" : "opacity-0",
            )}
            aria-hidden="true"
          >
            <QuestCardPreview
              quest={backOne.quest}
              className="pointer-events-none scale-[0.98] bg-surface-solid"
            />
          </div>
        ) : (
          <div
            className={cn(
              "absolute inset-x-1.5 bottom-0 top-1.5 z-0 min-h-[420px] rounded-2xl border border-border/80 bg-surface-solid transition-opacity duration-200",
              showStack ? "opacity-100" : "opacity-0",
            )}
            aria-hidden="true"
          />
        )}

        <ActiveQuestCard
          key={active.userQuestId}
          entry={active}
          exitDirection={exitDirection}
          onCommitSwipe={commitSwipe}
          onExitComplete={handleExitComplete}
        />
      </div>
    </div>
  );
}
