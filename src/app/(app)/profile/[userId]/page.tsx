import { notFound } from "next/navigation";
import { titleForLevel } from "@/lib/leveling";
import { getProfileSummary } from "@/lib/data";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const summary = await getProfileSummary(userId);

  if (!summary.profile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">{summary.profile.name}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Level {summary.profile.level} • {titleForLevel(summary.profile.level)}
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Badges</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {summary.badges.length === 0 ? (
            <p className="text-sm text-zinc-600">No badges yet.</p>
          ) : (
            summary.badges.map((badge) => (
              <span key={badge.id} className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-700">
                {badge.name}
              </span>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
