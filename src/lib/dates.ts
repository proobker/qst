const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function normalizeTimeZone(value: string | null | undefined): string {
  const candidate = value?.trim();
  if (!candidate) {
    return "UTC";
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return "UTC";
  }
}

export function localDateKey(timeZone: string | null | undefined, date = new Date()): string {
  const safeTimeZone = normalizeTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function localMonthKey(timeZone: string | null | undefined, date = new Date()): string {
  return localDateKey(timeZone, date).slice(0, 7);
}

export function isDateKey(value: string | null | undefined): value is string {
  if (!value || !DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function normalizeMonthKey(
  value: string | null | undefined,
  timeZone: string | null | undefined,
  reference = new Date(),
): string {
  const candidate = value?.trim();
  if (candidate && MONTH_KEY_PATTERN.test(candidate)) {
    const month = Number(candidate.slice(5, 7));
    if (month >= 1 && month <= 12) {
      return candidate;
    }
  }

  return localMonthKey(timeZone, reference);
}

export function formatMonthLabel(monthKey: string): string {
  const safeMonth = normalizeMonthKey(monthKey, "UTC");
  const [year, month] = safeMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return localDateKey("UTC");
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function dateKeyToUtcMidnight(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function zonedStartOfDateToUtc(dateKey: string, timeZone: string): Date {
  const safeTimeZone = normalizeTimeZone(timeZone);
  const [year, month, day] = dateKey.split("-").map(Number);
  const desiredUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let guess = new Date(desiredUtc);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(guess);

    const actualYear = Number(parts.find((part) => part.type === "year")?.value ?? year);
    const actualMonth = Number(parts.find((part) => part.type === "month")?.value ?? month);
    const actualDay = Number(parts.find((part) => part.type === "day")?.value ?? day);
    const actualHour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
    const actualMinute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
    const actualSecond = Number(parts.find((part) => part.type === "second")?.value ?? 0);
    const actualUtc = Date.UTC(actualYear, actualMonth - 1, actualDay, actualHour, actualMinute, actualSecond);
    const offset = actualUtc - desiredUtc;
    guess = new Date(guess.getTime() - offset);
  }

  return guess;
}

export function localMonthRange(timeZone: string | null | undefined, monthKey: string) {
  const safeTimeZone = normalizeTimeZone(timeZone);
  const safeMonth = normalizeMonthKey(monthKey, safeTimeZone);
  const [year, month] = safeMonth.split("-").map(Number);
  const monthStartDateKey = `${year}-${pad2(month)}-01`;
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const previousMonthDate = new Date(Date.UTC(year, month - 2, 1));
  const nextMonth = `${nextMonthDate.getUTCFullYear()}-${pad2(nextMonthDate.getUTCMonth() + 1)}`;
  const previousMonth = `${previousMonthDate.getUTCFullYear()}-${pad2(previousMonthDate.getUTCMonth() + 1)}`;
  const monthEndDateKey = `${nextMonth}-01`;

  return {
    monthStartDateKey,
    monthEndDateKey,
    previousMonth,
    nextMonth,
    startsAt: zonedStartOfDateToUtc(monthStartDateKey, safeTimeZone).toISOString(),
    endsAt: zonedStartOfDateToUtc(monthEndDateKey, safeTimeZone).toISOString(),
  };
}

export function monthCalendarDateKeys(monthKey: string): string[] {
  const safeMonth = normalizeMonthKey(monthKey, "UTC");
  const [year, month] = safeMonth.split("-").map(Number);
  const monthStartDateKey = `${year}-${pad2(month)}-01`;
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextMonthStartDateKey = `${nextMonthDate.getUTCFullYear()}-${pad2(nextMonthDate.getUTCMonth() + 1)}-01`;
  const monthEndDateKey = addDaysToDateKey(nextMonthStartDateKey, -1);
  const startDayOfWeek = dateKeyToUtcMidnight(monthStartDateKey).getUTCDay();
  const daysSinceMonday = (startDayOfWeek + 6) % 7;
  const endDayOfWeek = dateKeyToUtcMidnight(monthEndDateKey).getUTCDay();
  const daysUntilSunday = (7 - endDayOfWeek) % 7;
  const gridStartDateKey = addDaysToDateKey(monthStartDateKey, -daysSinceMonday);
  const gridEndDateKey = addDaysToDateKey(monthEndDateKey, daysUntilSunday);
  const keys: string[] = [];

  for (let dateKey = gridStartDateKey; dateKey <= gridEndDateKey; dateKey = addDaysToDateKey(dateKey, 1)) {
    keys.push(dateKey);
  }

  return keys;
}

export function localWeekRange(timeZone: string | null | undefined, reference = new Date()) {
  const todayKey = localDateKey(timeZone, reference);
  const todayUtc = dateKeyToUtcMidnight(todayKey);
  const dayOfWeek = todayUtc.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const weekStartDateKey = addDaysToDateKey(todayKey, -daysSinceMonday);
  const weekEndDateKey = addDaysToDateKey(weekStartDateKey, 7);

  return {
    weekStartDateKey,
    weekEndDateKey,
    startsAt: zonedStartOfDateToUtc(weekStartDateKey, normalizeTimeZone(timeZone)).toISOString(),
    endsAt: zonedStartOfDateToUtc(weekEndDateKey, normalizeTimeZone(timeZone)).toISOString(),
  };
}
