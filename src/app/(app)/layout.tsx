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
        <div className="min-h-[100svh] bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] sm:min-h-screen sm:pb-0">
          <AppNav notifications={notifications} unreadCount={unreadCount} />
          <main className="mx-auto w-full max-w-6xl px-3 py-4 page-enter sm:px-4 sm:py-6">{children}</main>
        </div>
      </LevelUpProvider>
    </ToastProvider>
  );
}
