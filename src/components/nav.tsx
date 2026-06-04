import Link from "next/link";
import { Compass, Flag, LogOut, ScrollText, UserRound, Users } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

type AppNavProps = {
  notifications: Notification[];
  unreadCount: number;
};

export function AppNav({ notifications, unreadCount }: AppNavProps) {
  const links = [
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/quests", label: "Quests", icon: Flag },
    { href: "/feed", label: "Feed", icon: ScrollText },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/profile", label: "Profile", icon: UserRound },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Logo href="/discover" size="sm" />
          <div className="flex items-center gap-2">
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            <form action={signOutAction} className="sm:hidden">
              <button
                type="submit"
                aria-label="Sign out"
                className="inline-flex items-center justify-center rounded-full border border-border p-2 text-muted transition hover:border-primary hover:text-primary"
              >
                <LogOut size={18} />
                <span className="sr-only">Sign out</span>
              </button>
            </form>
            <form action={signOutAction} className="hidden sm:block">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-primary hover:text-primary"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl flex-wrap items-center gap-2 px-4 pb-3 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-primary hover:text-primary"
            >
              <link.icon size={14} />
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium text-muted transition hover:text-primary",
              )}
            >
              <link.icon size={20} />
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
