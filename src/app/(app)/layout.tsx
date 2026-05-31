import { redirect } from "next/navigation";
import { AppNav } from "@/components/nav";
import { ToastProvider } from "@/components/ui/toast";
import { ensureUserProfile, getNotifications, getUnreadNotificationCount } from "@/lib/data";
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

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(user.id),
    getUnreadNotificationCount(user.id),
  ]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background pb-20 sm:pb-0">
        <AppNav notifications={notifications} unreadCount={unreadCount} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 page-enter">{children}</main>
      </div>
    </ToastProvider>
  );
}
