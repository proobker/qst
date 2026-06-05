import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Privacy Policy | qst",
  description: "How qst collects, uses, and protects account, quest, location, and social activity data.",
};

const sections = [
  {
    title: "Information We Collect",
    body: [
      "Account information: your sign-in provider account details, such as name, email address, avatar, and authentication identifiers.",
      "Profile and onboarding information: hobbies, display details, approximate or precise location data you choose to provide, and preferences used to suggest quests.",
      "Quest and social activity: accepted, rejected, active, completed, and incomplete quests; proof uploads; posts; comments or captions where available; friend connections; approvals and disapprovals; XP, levels, and badges.",
      "Technical information: basic device, browser, log, and security information needed to keep qst running, debug errors, and prevent abuse.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use your information to operate qst, personalize real-life quests, manage your active quests and proof uploads, show social posts to friends, calculate rewards, maintain profiles, and improve reliability and safety.",
      "Location and hobby information may be sent to an AI service to generate quest ideas. If the AI service is unavailable or no key is configured, qst can use fallback quest generation.",
    ],
  },
  {
    title: "Sharing and Service Providers",
    body: [
      "qst uses service providers to run core features, including Supabase for authentication, database, and storage; Google or GitHub when you choose those sign-in providers; and Gemini for AI quest generation when configured.",
      "We do not sell your personal information. We may share information if required by law, to protect qst and its users, or as part of a transfer of the project or service.",
    ],
  },
  {
    title: "Visibility",
    body: [
      "Quest completion posts, proof uploads, votes, profile details, badges, and stats may be visible to friends or other users according to the app's current social features.",
      "Avoid uploading proof or writing posts that include sensitive information you do not want other users to see.",
    ],
  },
  {
    title: "Retention and Deletion",
    body: [
      "We keep information while your account is active or as needed to provide qst, maintain records, resolve disputes, secure the service, and comply with legal obligations.",
      "You may request deletion of your account or personal information through the support or repository channel where you received access to qst.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use reasonable technical and organizational measures to protect your information, including server-only handling for privileged service keys.",
      "No online service can guarantee perfect security, so keep your sign-in account secure and report suspected issues promptly.",
    ],
  },
  {
    title: "Children",
    body: [
      "qst is not intended for children under 13. If you believe a child provided personal information, contact the qst team so it can be reviewed and removed where appropriate.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update this policy as qst changes. The effective date below shows when this version was last updated.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-12">
      <main className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Logo href="/" size="sm" />
          <Link
            href="/"
            className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Home
          </Link>
        </header>

        <article className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase text-primary">Effective June 5, 2026</p>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Privacy Policy</h1>
            <p className="text-base leading-7 text-muted">
              qst turns real life into an RPG-style social adventure game. This policy explains what information qst
              collects, how it is used, and the choices you have.
            </p>
          </div>

          {sections.map((section) => (
            <section key={section.title} className="space-y-3 border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              <div className="space-y-3 text-sm leading-7 text-muted sm:text-base">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p className="text-sm leading-7 text-muted sm:text-base">
              Questions, requests, or security concerns can be sent through the support or repository channel where you
              received access to qst.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
