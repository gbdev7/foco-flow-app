import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, useSubjects } from "@/hooks/use-app-data";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES, formatDayLabel, toISODate } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Foco" },
      { name: "description", content: "Provas, trabalhos, compromissos e lembretes num só calendário." },
      { property: "og:title", content: "Agenda — Foco" },
      {
        property: "og:description",
        content: "Provas, trabalhos, compromissos e lembretes num só calendário.",
      },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const qc = useQueryClient();
  const subjects = useSubjects();
  const [open, setOpen] = useState(false);
  const [reminder, setReminder] = useState(true);
  const [type, setType] = useState<string>("prova");
  const [subjectId, setSubjectId] = useState("none");

  const events = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date")
        .order("event_time", { nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      event_date: string;
      event_time: string;
    }) => {
      const user_id = await currentUserId();
      const { error } = await supabase.from("events").insert({
        user_id,
        title: input.title,
        description: input.description || null,
        event_type: type,
        event_date: input.event_date,
        event_time: input.event_time || null,
        reminder_enabled: reminder,
        subject_id: subjectId === "none" ? null : subjectId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      toast.success("Evento criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Evento removido");
    },
  });

  const today = toISODate();
  const upcoming = (events.data ?? []).filter((e) => e.event_date >= today);
  const past = (events.data ?? []).filter((e) => e.event_date < today).reverse();

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Datas importantes que orientam seu cronograma."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Novo evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo evento</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  create.mutate({
                    title: String(f.get("title")),
                    description: String(f.get("description") ?? ""),
                    event_date: String(f.get("event_date")),
                    event_time: String(f.get("event_time") ?? ""),
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="ev-title">Título</Label>
                  <Input id="ev-title" name="title" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ev-date">Data</Label>
                    <Input id="ev-date" name="event_date" type="date" required defaultValue={today} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ev-time">Hora</Label>
                    <Input id="ev-time" name="event_time" type="time" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Disciplina</Label>
                    <Select value={subjectId} onValueChange={setSubjectId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {(subjects.data ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-desc">Descrição</Label>
                  <Textarea id="ev-desc" name="description" rows={3} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <Label htmlFor="ev-reminder">Lembrete ativo</Label>
                  <Switch id="ev-reminder" checked={reminder} onCheckedChange={setReminder} />
                </div>
                <Button type="submit" className="w-full">
                  Salvar evento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Próximos</h2>
        {upcoming.length === 0 && <EmptyState>Nenhum evento futuro cadastrado.</EmptyState>}
        {upcoming.map((ev) => (
          <article key={ev.id} className="surface-card flex items-start gap-4 p-4">
            <div className="w-16 shrink-0 text-center">
              <p className="text-xs uppercase text-muted-foreground">{formatDayLabel(ev.event_date)}</p>
              {ev.event_time && <p className="text-sm font-medium">{ev.event_time.slice(0, 5)}</p>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{ev.title}</p>
                <Badge variant="secondary">
                  {EVENT_TYPES.find((t) => t.value === ev.event_type)?.label ?? ev.event_type}
                </Badge>
                {ev.reminder_enabled ? (
                  <Bell className="size-3.5 text-muted-foreground" />
                ) : (
                  <BellOff className="size-3.5 text-muted-foreground" />
                )}
              </div>
              {ev.description && (
                <p className="mt-1 text-sm text-muted-foreground">{ev.description}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(ev.id)} aria-label="Excluir">
              <Trash2 className="size-4" />
            </Button>
          </article>
        ))}
      </section>

      {past.length > 0 && (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Passados</h2>
          {past.map((ev) => (
            <article key={ev.id} className="flex items-center gap-4 rounded-lg border border-border px-4 py-3 opacity-60">
              <span className="w-16 text-xs text-muted-foreground">{formatDayLabel(ev.event_date)}</span>
              <span className="flex-1 truncate text-sm">{ev.title}</span>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(ev.id)} aria-label="Excluir">
                <Trash2 className="size-4" />
              </Button>
            </article>
          ))}
        </section>
      )}
    </>
  );
}