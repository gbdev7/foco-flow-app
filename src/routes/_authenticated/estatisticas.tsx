import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subjectMap, useSubjects } from "@/hooks/use-app-data";
import { PageHeader, EmptyState } from "@/components/page-header";
import { addDays, minutesBetween, startOfWeek, toISODate, WEEKDAYS } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/estatisticas")({
  head: () => ({
    meta: [
      { title: "Estatísticas — Foco" },
      { name: "description", content: "Horas por disciplina, consistência semanal e sessões de foco." },
      { property: "og:title", content: "Estatísticas — Foco" },
      {
        property: "og:description",
        content: "Horas por disciplina, consistência semanal e sessões de foco.",
      },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const subjects = useSubjects();
  const byId = subjectMap(subjects.data);
  const weekStart = startOfWeek();

  const stats = useQuery({
    queryKey: ["stats", toISODate(weekStart)],
    queryFn: async () => {
      const [blocks, sessions] = await Promise.all([
        supabase
          .from("study_blocks")
          .select("subject_id, start_datetime, end_datetime, status")
          .gte("start_datetime", weekStart.toISOString())
          .lt("start_datetime", addDays(weekStart, 7).toISOString()),
        supabase
          .from("pomodoro_sessions")
          .select("subject_id, focus_minutes, completed_cycles, started_at")
          .gte("started_at", weekStart.toISOString()),
      ]);
      if (blocks.error) throw blocks.error;
      if (sessions.error) throw sessions.error;
      return { blocks: blocks.data ?? [], sessions: sessions.data ?? [] };
    },
  });

  const perDay = Array.from({ length: 7 }, (_, i) => {
    const iso = toISODate(addDays(weekStart, i));
    const blockMin = (stats.data?.blocks ?? [])
      .filter((b) => b.status === "completed" && toISODate(new Date(b.start_datetime)) === iso)
      .reduce((sum, b) => sum + minutesBetween(b.start_datetime, b.end_datetime), 0);
    const focusMin = (stats.data?.sessions ?? [])
      .filter((s) => toISODate(new Date(s.started_at)) === iso)
      .reduce((sum, s) => sum + s.completed_cycles * s.focus_minutes, 0);
    return { label: WEEKDAYS[addDays(weekStart, i).getDay()], minutes: blockMin + focusMin };
  });
  const maxMinutes = Math.max(60, ...perDay.map((d) => d.minutes));

  const perSubject = new Map<string, number>();
  for (const b of stats.data?.blocks ?? []) {
    if (b.status !== "completed" || !b.subject_id) continue;
    perSubject.set(
      b.subject_id,
      (perSubject.get(b.subject_id) ?? 0) + minutesBetween(b.start_datetime, b.end_datetime),
    );
  }
  for (const s of stats.data?.sessions ?? []) {
    if (!s.subject_id) continue;
    perSubject.set(
      s.subject_id,
      (perSubject.get(s.subject_id) ?? 0) + s.completed_cycles * s.focus_minutes,
    );
  }
  const subjectRows = [...perSubject.entries()].sort((a, b) => b[1] - a[1]);
  const subjectMax = Math.max(1, ...subjectRows.map(([, m]) => m));
  const totalMinutes = perDay.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <>
      <PageHeader
        title="Estatísticas"
        subtitle={`${Math.round(totalMinutes / 6) / 10}h de estudo efetivo nesta semana`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="mb-4 font-semibold">Minutos por dia</h2>
          <div className="flex h-48 items-end gap-3">
            {perDay.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-primary"
                  style={{ height: `${(d.minutes / maxMinutes) * 100}%`, minHeight: 4 }}
                  title={`${d.minutes} min`}
                />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="mb-4 font-semibold">Por disciplina</h2>
          {subjectRows.length === 0 ? (
            <EmptyState>Sem estudo registrado nesta semana.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {subjectRows.map(([id, minutes]) => {
                const subject = byId.get(id);
                return (
                  <li key={id}>
                    <div className="flex justify-between text-sm">
                      <span>{subject?.name ?? "Disciplina"}</span>
                      <span className="text-muted-foreground">{minutes} min</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(minutes / subjectMax) * 100}%`,
                          backgroundColor: subject?.color ?? "var(--primary)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}