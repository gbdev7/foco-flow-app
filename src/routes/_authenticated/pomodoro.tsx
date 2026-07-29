import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Square, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, useSubjects } from "@/hooks/use-app-data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTime } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/pomodoro")({
  head: () => ({
    meta: [
      { title: "Pomodoro — Foco" },
      { name: "description", content: "Cronômetro pomodoro com ciclos 25/5, 50/10 ou personalizados." },
      { property: "og:title", content: "Pomodoro — Foco" },
      {
        property: "og:description",
        content: "Cronômetro pomodoro com ciclos 25/5, 50/10 ou personalizados.",
      },
    ],
  }),
  component: PomodoroPage,
});

const MODES = {
  "25_5": { focus: 25, break: 5, label: "25 / 5" },
  "50_10": { focus: 50, break: 10, label: "50 / 10" },
  custom: { focus: 30, break: 8, label: "Personalizado" },
} as const;

type ModeKey = keyof typeof MODES;

function PomodoroPage() {
  const qc = useQueryClient();
  const subjects = useSubjects();
  const [mode, setMode] = useState<ModeKey>("25_5");
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [subjectId, setSubjectId] = useState<string>("none");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [remaining, setRemaining] = useState(25 * 60);
  const [cycles, setCycles] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const history = useQuery({
    queryKey: ["pomodoro_recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("id, subject_id, focus_minutes, completed_cycles, started_at, interrupted")
        .order("started_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  function applyMode(next: ModeKey) {
    setMode(next);
    setFocusMin(MODES[next].focus);
    setBreakMin(MODES[next].break);
    if (!sessionId) setRemaining(MODES[next].focus * 60);
  }

  const start = useMutation({
    mutationFn: async () => {
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .insert({
          user_id,
          subject_id: subjectId === "none" ? null : subjectId,
          mode,
          focus_minutes: focusMin,
          break_minutes: breakMin,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      setSessionId(id);
      setPhase("focus");
      setCycles(0);
      setRemaining(focusMin * 60);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const finish = useMutation({
    mutationFn: async ({ interrupted }: { interrupted: boolean }) => {
      if (!sessionId) return;
      const { error } = await supabase
        .from("pomodoro_sessions")
        .update({ ended_at: new Date().toISOString(), interrupted, completed_cycles: cycles })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      setSessionId(null);
      setFocusMode(false);
      setRemaining(focusMin * 60);
      qc.invalidateQueries({ queryKey: ["pomodoro_recent"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast[vars.interrupted ? "info" : "success"](
        vars.interrupted ? "Sessão interrompida" : "Sessão finalizada",
      );
    },
  });

  useEffect(() => {
    if (!sessionId) return;
    tickRef.current = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || remaining > 0) return;
    if (phase === "focus") {
      const next = cycles + 1;
      setCycles(next);
      supabase
        .from("pomodoro_sessions")
        .update({ completed_cycles: next })
        .eq("id", sessionId)
        .then(() => qc.invalidateQueries({ queryKey: ["pomodoro_recent"] }));
      setPhase("break");
      setRemaining(breakMin * 60);
      toast.success("Hora da pausa!");
    } else {
      setPhase("focus");
      setRemaining(focusMin * 60);
      toast.info("De volta ao foco");
    }
  }, [remaining, sessionId, phase, cycles, breakMin, focusMin, qc]);

  const total = (phase === "focus" ? focusMin : breakMin) * 60;
  const progress = sessionId ? 1 - Math.max(0, remaining) / total : 0;
  const clock = `${String(Math.floor(Math.max(0, remaining) / 60)).padStart(2, "0")}:${String(
    Math.max(0, remaining) % 60,
  ).padStart(2, "0")}`;
  const subjectName = subjects.data?.find((s) => s.id === subjectId)?.name;

  const timer = (
    <div className="flex flex-col items-center gap-6">
      <div className="relative grid size-56 place-items-center rounded-full sm:size-64">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={phase === "focus" ? "var(--primary)" : "var(--secondary)"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="text-center">
          <p className="font-display text-5xl font-semibold tabular-nums">{clock}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            {phase === "focus" ? "Foco" : "Pausa"} · {cycles} ciclo(s)
          </p>
          {subjectName && <p className="mt-1 text-sm text-muted-foreground">{subjectName}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        {!sessionId ? (
          <Button size="lg" onClick={() => start.mutate()}>
            <Play className="size-4" /> Iniciar
          </Button>
        ) : (
          <>
            <Button size="lg" variant="secondary" onClick={() => finish.mutate({ interrupted: false })}>
              Finalizar
            </Button>
            <Button size="lg" variant="outline" onClick={() => finish.mutate({ interrupted: true })}>
              <Square className="size-4" /> Abandonar
            </Button>
          </>
        )}
        <Button size="lg" variant="ghost" onClick={() => setFocusMode((v) => !v)}>
          {focusMode ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          Modo foco
        </Button>
      </div>
    </div>
  );

  if (focusMode) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-background p-6">{timer}</div>
    );
  }

  return (
    <>
      <PageHeader title="Pomodoro" subtitle="Ciclos de foco vinculados a uma disciplina." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="surface-card p-8">{timer}</div>

        <div className="space-y-4">
          <div className="surface-card space-y-4 p-5">
            <div className="space-y-2">
              <Label>Modo</Label>
              <Select value={mode} onValueChange={(v) => applyMode(v as ModeKey)}>
                <SelectTrigger disabled={!!sessionId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="focus-min">Foco (min)</Label>
                  <Input
                    id="focus-min"
                    type="number"
                    min={1}
                    max={180}
                    value={focusMin}
                    disabled={!!sessionId}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setFocusMin(v);
                      if (!sessionId) setRemaining(v * 60);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="break-min">Pausa (min)</Label>
                  <Input
                    id="break-min"
                    type="number"
                    min={1}
                    max={60}
                    value={breakMin}
                    disabled={!!sessionId}
                    onChange={(e) => setBreakMin(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger disabled={!!sessionId}>
                  <SelectValue placeholder="Sem disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem disciplina</SelectItem>
                  {(subjects.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Sessões recentes</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(history.data ?? []).map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <span>{formatTime(s.started_at)}</span>
                  <span>
                    {s.completed_cycles * s.focus_minutes} min
                    {s.interrupted ? " · interrompida" : ""}
                  </span>
                </li>
              ))}
              {(history.data ?? []).length === 0 && <li>Nenhuma sessão ainda.</li>}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}