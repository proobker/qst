"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { MonthlyQuestCalendar } from "@/lib/types";
import { cn } from "@/lib/utils";

type QuestCalendarProps = {
  calendar: MonthlyQuestCalendar;
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function dateKeyToUtcDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function formatDateKey(dateKey: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(dateKeyToUtcDate(dateKey));
}

export function QuestCalendar({ calendar }: QuestCalendarProps) {
  const router = useRouter();
  const selectedDay = calendar.days.find((day) => day.isSelected);
  const selectedQuests = selectedDay?.quests ?? [];

  function goTo(month: string, day: string) {
    router.push(`/streak?month=${month}&day=${day}`);
  }

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 px-3 sm:px-4">
      <div className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-4 border-b border-border bg-background pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CalendarDays size={18} />
              Streak
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{calendar.monthLabel}</h1>
            <p className="mt-2 text-sm text-muted">
              {pluralize(calendar.totalCompleted, "quest")} completed this month
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(calendar.previousMonth, `${calendar.previousMonth}-01`)}
              aria-label="Previous month"
              title="Previous month"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted transition hover:border-primary hover:text-primary"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(calendar.today.slice(0, 7), calendar.today)}
              className="inline-flex h-10 items-center rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:border-primary"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => goTo(calendar.nextMonth, `${calendar.nextMonth}-01`)}
              aria-label="Next month"
              title="Next month"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted transition hover:border-primary hover:text-primary"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="flex min-h-[34rem] flex-col overflow-hidden rounded-xl border border-border bg-surface">
            <div className="grid grid-cols-7 border-b border-border bg-background/70">
              {weekdays.map((weekday) => (
                <div key={weekday} className="px-2 py-3 text-center text-xs font-semibold uppercase text-muted">
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid flex-1 grid-cols-7 auto-rows-fr">
              {calendar.days.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => goTo(day.date.slice(0, 7), day.date)}
                  aria-pressed={day.isSelected}
                  className={cn(
                    "group flex min-h-24 flex-col border-b border-r border-border p-2 text-left transition hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-28 lg:min-h-32",
                    !day.inCurrentMonth && "bg-background/60 text-muted",
                    day.isSelected && "bg-primary/10 ring-2 ring-inset ring-primary",
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                        day.isToday ? "bg-accent text-background" : "text-foreground",
                        !day.inCurrentMonth && !day.isToday && "text-muted",
                      )}
                    >
                      {day.day}
                    </span>
                    {day.count > 0 ? (
                      <span className="rounded-full border border-primary/40 bg-primary px-2 py-0.5 text-xs font-bold text-white">
                        {day.count}
                      </span>
                    ) : null}
                  </div>

                  {day.count > 0 ? (
                    <div className="mt-auto hidden space-y-1 pt-2 md:block">
                      {day.quests.slice(0, 2).map((quest) => (
                        <p key={quest.id} className="truncate text-xs font-medium text-foreground">
                          {quest.title}
                        </p>
                      ))}
                      {day.count > 2 ? (
                        <p className="text-xs font-medium text-primary">+{day.count - 2} more</p>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <aside className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {selectedDay
                    ? formatDateKey(selectedDay.date, { weekday: "long", month: "short", day: "numeric" })
                    : "Selected day"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  {pluralize(selectedQuests.length, "completion")}
                </h2>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
                <Trophy size={18} />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {selectedQuests.length === 0 ? (
                <p className="rounded-lg border border-border bg-background px-3 py-4 text-sm text-muted">
                  No quests completed.
                </p>
              ) : null}

              {selectedQuests.map((quest) => (
                <article key={quest.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-muted">
                    <span className="rounded-full border border-border px-2 py-1">{quest.difficulty}</span>
                    <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-accent">
                      {quest.xpReward} XP
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{quest.title}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {quest.category} at{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: calendar.timeZone,
                    }).format(new Date(quest.completedAt))}
                  </p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
