"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/notifications";
import { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  notifications: Notification[];
  unreadCount: number;
};

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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center justify-center rounded-full border border-border p-2 text-muted transition hover:border-primary hover:text-primary"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
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
      ) : null}
    </div>
  );
}
