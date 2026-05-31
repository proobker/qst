import Link from "next/link";
import { Compass, Flag, LogOut, ScrollText, UserRound, Users } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

export function AppNav() {
  const links = [
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/quests", label: "Quests", icon: Flag },
    { href: "/feed", label: "Feed", icon: ScrollText },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/profile", label: "Profile", icon: UserRound },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/discover" className="text-xl font-semibold tracking-tight text-zinc-900">
          qst
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              <link.icon size={14} />
              {link.label}
            </Link>
          ))}
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
