"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Flag, ScrollText, UserRound, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const links: NavLinkItem[] = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/quests", label: "Quests", icon: Flag },
  { href: "/feed", label: "Feed", icon: ScrollText },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: UserRound },
];

type NavLinksProps = {
  variant: "desktop" | "mobile";
};

export function NavLinks({ variant }: NavLinksProps) {
  const pathname = usePathname();

  if (variant === "desktop") {
    return (
      <>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                active
                  ? "border-primary/60 bg-primary/15 text-primary shadow-sm shadow-primary/20"
                  : "border-border text-muted hover:border-primary/50 hover:bg-primary/8 hover:text-primary",
              )}
            >
              <link.icon size={14} />
              {link.label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition",
              active ? "text-primary" : "text-muted hover:text-primary",
            )}
          >
            <span
              className={cn(
                "rounded-xl p-1.5 transition",
                active && "bg-primary/15 shadow-sm shadow-primary/25",
              )}
            >
              <link.icon size={20} />
            </span>
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
