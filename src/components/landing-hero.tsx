"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { Compass, Flag, KeyRound, Mail, Sparkles, Trophy, Users } from "lucide-react";
import {
  requestEmailOtpAction,
  signInWithGoogle,
  verifyEmailOtpAction,
  type EmailOtpState,
} from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { Spinner } from "@/components/ui/spinner";

const initialEmailOtpState: EmailOtpState = {
  ok: false,
  email: "",
  message: "",
};

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
  const [emailOtpState, requestEmailOtp, sendingOtp] = useActionState(
    requestEmailOtpAction,
    initialEmailOtpState,
  );
  const [verifyOtpState, verifyEmailOtp, verifyingOtp] = useActionState(
    verifyEmailOtpAction,
    initialEmailOtpState,
  );
  const otpEmail = emailOtpState.email || verifyOtpState.email;

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

          <motion.div variants={item} className="mt-8 space-y-4">
            <form action={requestEmailOtp} className="space-y-3">
              <label htmlFor="email-login" className="sr-only">
                Email address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2.5 transition focus-within:border-primary">
                <Mail size={18} className="shrink-0 text-muted" />
                <input
                  id="email-login"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={emailOtpState.email}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={sendingOtp}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingOtp ? <Spinner size="sm" /> : <Mail size={16} />}
                {sendingOtp ? "Sending code..." : "Send email login code"}
              </button>
            </form>

            {emailOtpState.message ? (
              <p
                className={`rounded-lg border px-3 py-2 text-sm ${
                  emailOtpState.ok
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-red-400/40 bg-red-500/10 text-red-300"
                }`}
                role="status"
              >
                {emailOtpState.message}
              </p>
            ) : null}

            {emailOtpState.ok ? (
              <form action={verifyEmailOtp} className="space-y-3 rounded-xl border border-border p-3">
                <input type="hidden" name="email" value={otpEmail} />
                <label htmlFor="email-otp" className="sr-only">
                  One-time code
                </label>
                <p className="text-xs leading-relaxed text-muted">
                  You can also use the sign-in link in the email. To enter a code here, include the OTP token in your
                  Supabase email template.
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2.5 transition focus-within:border-primary">
                  <KeyRound size={18} className="shrink-0 text-muted" />
                  <input
                    id="email-otp"
                    name="token"
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                  />
                </div>
                {verifyOtpState.message ? (
                  <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {verifyOtpState.message}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="btn-primary flex w-full items-center justify-center py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifyingOtp ? <Spinner size="sm" /> : null}
                  {verifyingOtp ? "Verifying..." : "Verify code"}
                </button>
              </form>
            ) : null}

            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </motion.div>

          <motion.form variants={item} action={signInWithGoogle}>
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
