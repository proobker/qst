import { redirect } from "next/navigation";
import { AppNav } from "@/components/nav";
import { LevelUpProvider } from "@/components/level-up-provider";
import { ToastProvider } from "@/components/ui/toast";
import {
  ensureUserProfile,
  getNotifications,
  getPendingLevelUp,
  getUnreadNotificationCount,
} from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  await ensureUserProfile(user);

  const [notifications, unreadCount, pendingLevelUp] = await Promise.all([
    getNotifications(user.id),
    getUnreadNotificationCount(user.id),
    getPendingLevelUp(user.id),
  ]);

  return (
    <ToastProvider>
      <LevelUpProvider initialCelebration={pendingLevelUp}>
        <div className="app-mesh min-h-screen pb-20 sm:pb-0">
          <div className="relative z-40">
            <AppNav notifications={notifications} unreadCount={unreadCount} />
          </div>
          <main className="relative z-[1] mx-auto w-full max-w-6xl px-4 py-6 page-enter">
            {children}
          </main>
        </div>
      </LevelUpProvider>
    </ToastProvider>
  );
}
