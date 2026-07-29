export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Local (device timezone) date as YYYY-MM-DD — avoids UTC midnight rollover. */
export function toISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday-based start of week. */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  return addDays(d, -day);
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDayLabel(value: string): string {
  return fromISODate(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function minutesBetween(startISO: string, endISO: string): number {
  return Math.max(0, Math.round((+new Date(endISO) - +new Date(startISO)) / 60000));
}

export const EVENT_TYPES = [
  { value: "prova", label: "Prova" },
  { value: "trabalho", label: "Trabalho" },
  { value: "compromisso", label: "Compromisso" },
  { value: "lembrete", label: "Lembrete" },
] as const;

export const BLOCK_STATUS = [
  { value: "planned", label: "Planejado" },
  { value: "completed", label: "Concluído" },
  { value: "missed", label: "Perdido" },
  { value: "rescheduled", label: "Reagendado" },
] as const;

export const SUBJECT_COLORS = [
  "#4F46E5",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
];

/**
 * Streak = consecutive days (walking back from today) on which the habit was
 * expected (per target_days) and completed. Days outside target_days are skipped.
 */
export function computeStreak(
  targetDays: number[],
  completedDates: Set<string>,
  today: Date = new Date(),
): number {
  let streak = 0;
  let cursor = startOfDay(today);
  // Today not being logged yet should not break an ongoing streak.
  if (targetDays.includes(cursor.getDay()) && !completedDates.has(toISODate(cursor))) {
    cursor = addDays(cursor, -1);
  }
  for (let i = 0; i < 365; i++) {
    if (targetDays.includes(cursor.getDay())) {
      if (!completedDates.has(toISODate(cursor))) break;
      streak++;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}