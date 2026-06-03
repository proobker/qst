"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
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

type QuestSwipeDeckProps = {
  quests: QuestStackEntry[];
};

const SWIPE_THRESHOLD = 120;

function mergeServerQuests(prev: QuestStackEntry[], fromServer: QuestStackEntry[]): QuestStackEntry[] {
  if (prev.length === 0) {
    return fromServer;
  }

  const known = new Set(prev.map((entry) => entry.userQuestId));
  const appended = fromServer.filter((entry) => !known.has(entry.userQuestId));
  return appended.length > 0 ? [...prev, ...appended] : prev;
}

function QuestCardPreview({ quest, className }: { quest: QuestData; className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-6", className)}>
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
  pending,
  onCommitSwipe,
  onExitComplete,
}: {
  entry: QuestStackEntry;
  exitDirection: "left" | "right" | null;
  pending: boolean;
  onCommitSwipe: (direction: "left" | "right") => void;
  onExitComplete: () => void;
}) {
  const { quest } = entry;
  const [dragX, setDragX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const acceptOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rejectOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onCommitSwipe("right");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onCommitSwipe("left");
    }
  }

  return (
    <motion.article
      key={entry.userQuestId}
      drag={pending || exitDirection ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      style={{ x, rotate }}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={handleDragEnd}
      initial={{ x: 0, opacity: 1 }}
      animate={
        exitDirection === "right"
          ? { x: 500, opacity: 1, transition: { duration: 0.28 } }
          : exitDirection === "left"
            ? { x: -500, opacity: 1, transition: { duration: 0.28 } }
            : { x: 0, opacity: 1 }
      }
      onAnimationComplete={() => {
        if (exitDirection) {
          onExitComplete();
        }
      }}
      className={cn(
        "glass-card relative z-10 touch-none rounded-2xl bg-surface-solid p-6",
        pending && "pointer-events-none opacity-70",
      )}
      role="group"
      aria-label={`Quest card: ${quest.title}. Swipe right to accept, left to reject.`}
    >
      <motion.div
        style={{ opacity: exitDirection === "right" ? 1 : acceptOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-4 border-success bg-success/10"
      >
        <div className="flex items-center gap-2 text-3xl font-bold text-success">
          <Check size={40} />
          Accept
        </div>
      </motion.div>

      <motion.div
        style={{ opacity: exitDirection === "left" ? 1 : rejectOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-4 border-red-400 bg-red-500/10"
      >
        <div className="flex items-center gap-2 text-3xl font-bold text-red-400">
          <X size={40} />
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

      {pending ? (
        <div className="mt-6 flex justify-center">
          <Spinner label="Processing..." />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
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
      )}

      <p className="mt-3 text-center text-xs text-muted">
        Drag the card or use ← → arrow keys
        {dragX !== 0 ? ` · ${Math.abs(Math.round(dragX))}px` : ""}
      </p>
    </motion.article>
  );
}

export function QuestSwipeDeck({ quests }: QuestSwipeDeckProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deck, setDeck] = useState(quests);
  const [pending, startTransition] = useTransition();
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const pendingSwipeRef = useRef<{ entry: QuestStackEntry; direction: "left" | "right" } | null>(null);

  useEffect(() => {
    setDeck((prev) => mergeServerQuests(prev, quests));
  }, [quests]);

  const active = deck[0];
  const backOne = deck[1];
  const backTwo = deck[2];

  const commitSwipe = useCallback((direction: "left" | "right") => {
    if (pending || exitDirection || !active) {
      return;
    }
    setExitDirection(direction);
  }, [active, exitDirection, pending]);

  const handleExitComplete = useCallback(() => {
    if (!exitDirection || !active) {
      return;
    }

    const swiped = { entry: active, direction: exitDirection };
    pendingSwipeRef.current = swiped;

    setDeck((prev) => prev.slice(1));
    setExitDirection(null);

    startTransition(async () => {
      try {
        if (swiped.direction === "right") {
          await swipeRightAction(swiped.entry.userQuestId);
          toast("Quest accepted — view it anytime on Quests.", "success");
        } else {
          await swipeLeftAction(swiped.entry.userQuestId);
        }
        pendingSwipeRef.current = null;
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        toast(message, "error");
        setDeck((prev) => {
          if (prev.some((entry) => entry.userQuestId === swiped.entry.userQuestId)) {
            return prev;
          }
          return [swiped.entry, ...prev];
        });
        pendingSwipeRef.current = null;
      }
    });
  }, [active, exitDirection, router, toast]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (pending || exitDirection) {
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
  }, [commitSwipe, pending, exitDirection]);

  if (deck.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading next quests..." />
      </div>
    );
  }

  if (!active) {
    return null;
  }

  const showStack = !exitDirection;

  return (
    <div className="relative mx-auto w-full max-w-md">
      {backTwo ? (
        <div
          className={cn(
            "absolute inset-x-3 top-3 z-0 transition-opacity duration-200",
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
            "absolute inset-x-3 top-3 z-0 h-full min-h-[280px] rounded-2xl border border-border/60 bg-surface-solid transition-opacity duration-200",
            showStack ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />
      )}

      {backOne ? (
        <div
          className={cn(
            "absolute inset-x-1.5 top-1.5 z-0 transition-opacity duration-200",
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
            "absolute inset-x-1.5 top-1.5 z-0 h-full min-h-[280px] rounded-2xl border border-border/80 bg-surface-solid transition-opacity duration-200",
            showStack ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />
      )}

      {deck.length > 1 ? (
        <p className="relative mb-2 text-center text-xs text-muted">{deck.length - 1} more in stack</p>
      ) : null}

      <ActiveQuestCard
        entry={active}
        exitDirection={exitDirection}
        pending={pending}
        onCommitSwipe={commitSwipe}
        onExitComplete={handleExitComplete}
      />
    </div>
  );
}
