import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-header";
import { addDays, formatDayLabel, minutesBetween, startOfWeek, toISODate } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Foco" },
      { name: "description", content: "Resumo do seu dia: blocos, eventos e hábitos." },
      { property: "og:title", content: "Painel — Foco" },
      { property: "og:description", content: "Resumo do seu dia: blocos, eventos e hábitos." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const today = toISODate();
  const weekStart = startOfWeek();

  const blocks = useQuery({
    queryKey: ["dashboard_blocks", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_blocks")
        .select("id, title, start_datetime, end_datetime, status")
        .gte("start_datetime", weekStart.toISOString())
        .lt("start_datetime", addDays(weekStart, 7).toISOString())
        .order("start_datetime");
      if (error) throw error;
      return data ?? [];
    },
  });

  const events = useQuery({
    queryKey: ["dashboard_events", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, event_date, event_type")
        .gte("event_date", today)
        .order("event_date")
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const todayBlocks = (blocks.data ?? []).filter(
    (b) => toISODate(new Date(b.start_datetime)) === today,
  );
  const doneMinutes = (blocks.data ?? [])
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + minutesBetween(b.start_datetime, b.end_datetime), 0);

  return (
    <>
      <PageHeader title="Painel" subtitle="Seu resumo de hoje e da semana." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Blocos hoje</p>
          <p className="mt-1 font-display text-3xl font-semibold">{todayBlocks.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Horas concluídas (semana)</p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {Math.round(doneMinutes / 6) / 10}h
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Próximos eventos</p>
          <p className="mt-1 font-display text-3xl font-semibold">{(events.data ?? []).length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Blocos de hoje</h2>
            <Link to="/cronograma" className="text-sm text-primary hover:underline">
              Ver cronograma
            </Link>
          </div>
          {todayBlocks.length === 0 ? (
            <EmptyState>Nada planejado para hoje.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {todayBlocks.map((b) => (
                <li key={b.id} className="flex justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{b.title}</span>
                  <span className="text-muted-foreground">
                    {new Date(b.start_datetime).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Próximos eventos</h2>
            <Link to="/agenda" className="text-sm text-primary hover:underline">
              Ver agenda
            </Link>
          </div>
          {(events.data ?? []).length === 0 ? (
            <EmptyState>Nenhum evento futuro.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {(events.data ?? []).map((e) => (
                <li key={e.id} className="flex justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{e.title}</span>
                  <span className="text-muted-foreground">{formatDayLabel(e.event_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}