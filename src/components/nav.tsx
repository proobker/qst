import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { NotificationBell } from "@/components/notification-bell";
import { Notification } from "@/lib/types";

type AppNavProps = {
  notifications: Notification[];
  unreadCount: number;
};

export function AppNav({ notifications, unreadCount }: AppNavProps) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Logo href="/discover" size="sm" />
          <div className="flex items-center gap-2">
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            <form action={signOutAction} className="hidden sm:block">
              <button type="submit" className="btn-ghost">
                <LogOut size={14} />
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl flex-wrap items-center gap-2 px-4 pb-3 sm:flex">
          <NavLinks variant="desktop" />
        </nav>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-background/85 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
          <NavLinks variant="mobile" />
        </div>
      </nav>
    </>
  );
}
