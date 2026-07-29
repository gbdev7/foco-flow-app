import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronLeft, ChevronRight, Check, X, CalendarClock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, subjectMap, useSubjects } from "@/hooks/use-app-data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { addDays, minutesBetween, startOfWeek, toISODate, WEEKDAYS } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/cronograma")({
  head: () => ({
    meta: [
      { title: "Cronograma — Foco" },
      { name: "description", content: "Planeje blocos de estudo semanais e acompanhe o cumprimento." },
      { property: "og:title", content: "Cronograma — Foco" },
      {
        property: "og:description",
        content: "Planeje blocos de estudo semanais e acompanhe o cumprimento.",
      },
    ],
  }),
  component: SchedulePage,
});

type Block = {
  id: string;
  title: string;
  subject_id: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  source: string;
};

function localDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function SchedulePage() {
  const qc = useQueryClient();
  const subjects = useSubjects();
  const byId = subjectMap(subjects.data);
  const [weekOffset, setWeekOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("none");

  const weekStart = addDays(startOfWeek(), weekOffset * 7);
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const blocks = useQuery({
    queryKey: ["study_blocks", toISODate(weekStart)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_blocks")
        .select("id, title, subject_id, start_datetime, end_datetime, status, source")
        .gte("start_datetime", weekStart.toISOString())
        .lt("start_datetime", weekEnd.toISOString())
        .order("start_datetime");
      if (error) throw error;
      return (data ?? []) as Block[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { title: string; date: string; start: string; end: string }) => {
      const user_id = await currentUserId();
      const { error } = await supabase.from("study_blocks").insert({
        user_id,
        title: input.title,
        subject_id: subjectId === "none" ? null : subjectId,
        start_datetime: localDateTime(input.date, input.start),
        end_datetime: localDateTime(input.date, input.end),
        source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study_blocks"] });
      setOpen(false);
      toast.success("Bloco criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("study_blocks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study_blocks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const reschedule = useMutation({
    mutationFn: async (block: Block) => {
      const user_id = await currentUserId();
      const start = new Date(block.start_datetime);
      const end = new Date(block.end_datetime);
      const { error: updateError } = await supabase
        .from("study_blocks")
        .update({ status: "rescheduled" })
        .eq("id", block.id);
      if (updateError) throw updateError;
      const { error } = await supabase.from("study_blocks").insert({
        user_id,
        title: block.title,
        subject_id: block.subject_id,
        start_datetime: addDays(start, 1).toISOString(),
        end_datetime: addDays(end, 1).toISOString(),
        source: "manual",
        rescheduled_from: block.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study_blocks"] });
      toast.success("Bloco movido para o dia seguinte");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study_blocks"] }),
  });

  const plannedMinutes = (blocks.data ?? []).reduce(
    (sum, b) => sum + minutesBetween(b.start_datetime, b.end_datetime),
    0,
  );

  return (
    <>
      <PageHeader
        title="Cronograma"
        subtitle={`${Math.round(plannedMinutes / 6) / 10}h planejadas nesta semana`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Semana anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => setWeekOffset(0)}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Próxima semana">
              <ChevronRight className="size-4" />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> Bloco
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo bloco de estudo</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    create.mutate({
                      title: String(f.get("title")),
                      date: String(f.get("date")),
                      start: String(f.get("start")),
                      end: String(f.get("end")),
                    });
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="bl-title">Título</Label>
                    <Input id="bl-title" name="title" required placeholder="Revisão de Cálculo" />
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
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="bl-date">Data</Label>
                      <Input id="bl-date" name="date" type="date" required defaultValue={toISODate()} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bl-start">Início</Label>
                      <Input id="bl-start" name="start" type="time" required defaultValue="19:00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bl-end">Fim</Label>
                      <Input id="bl-end" name="end" type="time" required defaultValue="20:00" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Criar bloco
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => {
          const iso = toISODate(day);
          const dayBlocks = (blocks.data ?? []).filter(
            (b) => toISODate(new Date(b.start_datetime)) === iso,
          );
          const isToday = iso === toISODate();
          return (
            <div
              key={iso}
              className={`surface-card p-4 ${isToday ? "ring-1 ring-primary" : ""}`}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm font-semibold">{WEEKDAYS[day.getDay()]}</span>
                <span className="text-xs text-muted-foreground">
                  {day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              </div>
              <div className="space-y-2">
                {dayBlocks.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sem blocos.</p>
                )}
                {dayBlocks.map((b) => {
                  const subject = b.subject_id ? byId.get(b.subject_id) : undefined;
                  return (
                    <div
                      key={b.id}
                      className="rounded-lg border border-border p-3"
                      style={subject ? { borderLeft: `3px solid ${subject.color}` } : undefined}
                    >
                      <p className="text-sm font-medium leading-tight">{b.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(b.start_datetime).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" – "}
                        {new Date(b.end_datetime).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {subject ? ` · ${subject.name}` : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        <Button
                          size="icon"
                          variant={b.status === "completed" ? "default" : "ghost"}
                          onClick={() => setStatus.mutate({ id: b.id, status: "completed" })}
                          aria-label="Concluir"
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant={b.status === "missed" ? "destructive" : "ghost"}
                          onClick={() => setStatus.mutate({ id: b.id, status: "missed" })}
                          aria-label="Marcar como perdido"
                        >
                          <X className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => reschedule.mutate(b)}
                          aria-label="Reagendar para amanhã"
                        >
                          <CalendarClock className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove.mutate(b.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}