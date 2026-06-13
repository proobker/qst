import { QuestCalendar } from "@/components/quest-calendar";
import { getMonthlyQuestCalendar } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StreakPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const params = await searchParams;
  const calendar = await getMonthlyQuestCalendar(user.id, {
    month: params.month,
    day: params.day,
  });

  return <QuestCalendar calendar={calendar} />;
}
