"use client";

import { motion } from "framer-motion";
import { Compass, Flag, Sparkles, Trophy, Users } from "lucide-react";
import { signInWithGoogle } from "@/app/actions/auth";
import { Logo } from "@/components/logo";

const features = [
  {
    icon: Compass,
    title: "Discover quests",
    description: "AI-generated side quests tailored to your hobbies and location.",
  },
  {
    icon: Flag,
    title: "Complete & prove",
    description: "Accept challenges, upload proof, and earn XP with friend verification.",
  },
  {
    icon: Users,
    title: "Adventure together",
    description: "Build your party, approve completions, and grow your reputation.",
  },
  {
    icon: Trophy,
    title: "Level up",
    description: "Collect badges, climb ranks, and celebrate epic level-ups.",
  },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export function LandingHero() {
  return (
    <div className="landing-mesh app-mesh flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div
        className="pointer-events-none fixed left-[10%] top-[20%] h-64 w-64 rounded-full opacity-30 blur-3xl animate-pulse-glow"
        style={{ background: "var(--glow-primary)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed bottom-[15%] right-[8%] h-48 w-48 rounded-full opacity-25 blur-3xl animate-pulse-glow"
        style={{ background: "var(--glow-accent)", animationDelay: "2s" }}
        aria-hidden="true"
      />

      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-3xl space-y-8"
      >
        <motion.div
          variants={item}
          className="glass-card overflow-hidden rounded-3xl p-8 sm:p-10"
        >
          <header className="flex flex-col items-center gap-5 text-center">
            <motion.div variants={item} className="animate-float">
              <Logo size="lg" />
            </motion.div>
            <motion.span variants={item} className="chip">
              <Sparkles size={12} />
              real life adventure game
            </motion.span>
            <motion.h1
              variants={item}
              className="text-3xl font-bold tracking-tight text-gradient sm:text-4xl"
            >
              Turn real life into an RPG
            </motion.h1>
            <motion.p variants={item} className="max-w-lg text-base leading-relaxed text-muted">
              Discover AI-generated side quests based on your hobbies and location. Complete them,
              post proof, collect approvals from friends, and level up with badges.
            </motion.p>
          </header>

          <motion.form variants={item} action={signInWithGoogle} className="mt-8">
            <button type="submit" className="btn-primary w-full py-3.5 text-base">
              Continue with Google
            </button>
          </motion.form>
        </motion.div>

        <motion.div
          variants={container}
          className="grid gap-3 sm:grid-cols-2"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="glass-card glass-card-hover rounded-2xl p-5"
            >
              <div className="mb-3 inline-flex rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-primary">
                <feature.icon size={20} />
              </div>
              <h2 className="text-sm font-semibold text-foreground">{feature.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.main>
    </div>
  );
}
