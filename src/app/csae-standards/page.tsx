import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "CSAE Standards | qst",
  description:
    "qst's externally published standards against child sexual abuse and exploitation.",
};

const sections = [
  {
    title: "Zero Tolerance",
    body: [
      "qst has zero tolerance for child sexual abuse and exploitation (CSAE), child sexual abuse material (CSAM), grooming, sextortion, trafficking, sexual solicitation of minors, or any behaviour that sexualises, harms, exploits, or endangers children.",
      "Users must not upload, create, request, share, promote, or link to any content involving the sexual abuse or exploitation of minors. This applies to photos, text, profile content, proof uploads, posts, messages where available, usernames, links, and any other app-controlled content.",
    ],
  },
  {
    title: "Enforcement",
    body: [
      "When qst becomes aware of content or behaviour that appears to violate these standards, we may remove content, restrict access, suspend or delete accounts, preserve relevant information where legally appropriate, and report suspected CSAE or CSAM to the proper authorities or child-safety organisations.",
      "Attempts to evade enforcement, re-upload removed material, encourage exploitation, or target minors for sexual purposes are also prohibited.",
    ],
  },
  {
    title: "Reporting",
    body: [
      "If you see content or behaviour on qst that may involve CSAE, CSAM, grooming, exploitation, or immediate danger to a child, report it using the developer contact email listed on qst's Google Play Store listing. Include the username, profile, post, quest, approximate time, and any details that help us locate the issue.",
      "If a child is in immediate danger, contact local emergency services or law enforcement first. You can also report suspected online child sexual exploitation to the National Center for Missing & Exploited Children CyberTipline at report.cybertip.org.",
    ],
  },
  {
    title: "Review and Cooperation",
    body: [
      "Reports are reviewed as quickly as possible. qst cooperates with valid legal requests and child-safety investigations consistent with applicable law.",
      "These standards apply globally to all users of qst and are reviewed as the app's social and user-generated content features evolve.",
    ],
  },
];

export default function CsaeStandardsPage() {
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
            <p className="text-sm font-semibold uppercase text-primary">Effective June 10, 2026</p>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Child Safety and CSAE Standards
            </h1>
            <p className="text-base leading-7 text-muted">
              These standards explain qst&apos;s policies against child sexual abuse and exploitation and apply to all
              app users and app-controlled content.
            </p>
          </div>

          {sections.map((section) => (
            <section key={section.title} className="space-y-3 border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              <div className="space-y-3 text-sm leading-7 text-muted sm:text-base">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>
                    {paragraph.includes("report.cybertip.org") ? (
                      <>
                        If a child is in immediate danger, contact local emergency services or law enforcement first.
                        You can also report suspected online child sexual exploitation to the National Center for
                        Missing &amp; Exploited Children CyberTipline at{" "}
                        <a
                          href="https://report.cybertip.org/"
                          className="font-semibold text-primary transition hover:text-primary-hover"
                        >
                          report.cybertip.org
                        </a>
                        .
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
