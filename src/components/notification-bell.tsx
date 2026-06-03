"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/notifications";
import { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  notifications: Notification[];
  unreadCount: number;
};

function panelPositionFromButton(button: HTMLButtonElement | null): { top: number; right: number } | null {
  const rect = button?.getBoundingClientRect();
  if (!rect) {
    return null;
  }
  return {
    top: rect.bottom + 8,
    right: Math.max(8, window.innerWidth - rect.right),
  };
}

function notificationLink(notification: Notification): string {
  switch (notification.type) {
    case "friend_request":
    case "friend_accepted":
      return "/friends";
    case "like":
    case "approval":
      return "/feed";
    case "level_up":
      return "/profile";
    default:
      return "/feed";
  }
}

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const next = panelPositionFromButton(buttonRef.current);
      if (next) {
        setPanelPosition(next);
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const overlay =
    open && panelPosition ? (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-transparent"
          onClick={() => setOpen(false)}
          aria-label="Close notifications"
        />
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed z-[60] w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          style={{ top: panelPosition.top, right: panelPosition.right }}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsReadAction}>
                <button type="submit" className="text-xs font-medium text-primary hover:text-primary-hover">
                  Mark all read
                </button>
              </form>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <form key={notification.id} action={markNotificationReadAction}>
                  <input type="hidden" name="notificationId" value={notification.id} />
                  <button
                    type="submit"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block w-full border-b border-border px-4 py-3 text-left text-sm transition hover:bg-surface-hover",
                      !notification.read && "bg-primary/5",
                    )}
                  >
                    <p className="text-foreground">{notification.message}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                    <span className="sr-only">Go to {notificationLink(notification)}</span>
                  </button>
                </form>
              ))
            )}
          </div>
        </div>
      </>
    ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              setPanelPosition(panelPositionFromButton(buttonRef.current));
            }
            return next;
          });
        }}
        className="relative inline-flex items-center justify-center rounded-full border border-border p-2 text-muted transition hover:border-primary hover:text-primary"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {overlay && typeof document !== "undefined" ? createPortal(overlay, document.body) : null}
    </div>
  );
}
