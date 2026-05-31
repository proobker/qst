"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
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

type QuestSwipeDeckProps = {
  userQuestId: string;
  quest: QuestData;
};

const SWIPE_THRESHOLD = 120;

export function QuestSwipeDeck({ userQuestId, quest }: QuestSwipeDeckProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [dragX, setDragX] = useState(0);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const acceptOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rejectOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const commitSwipe = useCallback(
    (direction: "left" | "right") => {
      if (pending) {
        return;
      }
      setExitDirection(direction);
      startTransition(async () => {
        const formData = new FormData();
        formData.set("userQuestId", userQuestId);
        try {
          if (direction === "right") {
            await swipeRightAction(formData);
            toast("Quest accepted!", "success");
          } else {
            await swipeLeftAction(formData);
            toast("Quest rejected.", "info");
          }
          router.refresh();
        } catch {
          toast("Something went wrong. Try again.", "error");
          setExitDirection(null);
        }
      });
    },
    [pending, userQuestId, router, toast],
  );

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      commitSwipe("right");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      commitSwipe("left");
    }
  }

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

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Back card (stack effect) */}
      <div
        className="absolute inset-x-3 top-3 h-full rounded-2xl border border-border bg-surface/60"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-1.5 top-1.5 h-full rounded-2xl border border-border bg-surface/80"
        aria-hidden="true"
      />

      <motion.article
        drag={pending || exitDirection ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        style={{ x, rotate }}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={
          exitDirection === "right"
            ? { x: 500, opacity: 0, transition: { duration: 0.3 } }
            : exitDirection === "left"
              ? { x: -500, opacity: 0, transition: { duration: 0.3 } }
              : { x: 0, opacity: 1 }
        }
        className={cn(
          "relative touch-none rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-primary/10",
          pending && "pointer-events-none opacity-70",
        )}
        role="group"
        aria-label={`Quest card: ${quest.title}. Swipe right to accept, left to reject.`}
      >
        <motion.div
          style={{ opacity: acceptOpacity }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-4 border-success bg-success/10"
        >
          <div className="flex items-center gap-2 text-3xl font-bold text-success">
            <Check size={40} />
            Accept
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: rejectOpacity }}
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

        <h2 className="text-2xl font-bold tracking-tight text-foreground">{quest.title}</h2>
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
              onClick={() => commitSwipe("left")}
              className="rounded-lg border border-border px-4 py-3 text-sm font-semibold text-muted transition hover:border-red-400 hover:text-red-400"
              aria-label="Reject quest"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => commitSwipe("right")}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
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
    </div>
  );
}
