import type { ReactNode } from "react";

const EMOJI: Record<string, string> = {
  Painel: "🏠",
  Dashboard: "🏠",
  Cronograma: "🗓️",
  Agenda: "📌",
  Anotações: "📝",
  Hábitos: "🔁",
  Pomodoro: "⏱️",
  Estatísticas: "📊",
  Configurações: "⚙️",
};

export function PageHeader({
  title,
  subtitle,
  action,
  emoji,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  emoji?: string;
}) {
  const icon = emoji ?? EMOJI[title] ?? "📄";
  return (
    <div className="mb-8">
      <span className="block text-4xl leading-none">{icon}</span>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <h1 className="truncate text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-tight">
          {title}
        </h1>
        {action}
      </div>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      <hr className="notion-divider mt-5" />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded px-2 py-3 text-sm text-muted-foreground hover:bg-accent">{children}</p>
  );
}