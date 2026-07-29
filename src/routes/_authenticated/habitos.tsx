import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Flame, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/hooks/use-app-data";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WEEKDAYS, addDays, computeStreak, toISODate, startOfDay } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/habitos")({
  head: () => ({
    meta: [
      { title: "Hábitos — Foco" },
      { name: "description", content: "Faça check-in diário e acompanhe suas sequências." },
      { property: "og:title", content: "Hábitos — Foco" },
      { property: "og:description", content: "Faça check-in diário e acompanhe suas sequências." },
    ],
  }),
  component: HabitsPage,
});

type Habit = { id: string; name: string; icon: string; target_days: number[]; active: boolean };

function HabitsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const today = toISODate();
  const since = toISODate(addDays(startOfDay(), -120));

  const habits = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("id, name, icon, target_days, active")
        .eq("active", true)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Habit[];
    },
  });

  const logs = useQuery({
    queryKey: ["habit_logs", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_logs")
        .select("habit_id, log_date, completed")
        .gte("log_date", since);
      if (error) throw error;
      return data ?? [];
    },
  });

  const createHabit = useMutation({
    mutationFn: async (input: { name: string; icon: string }) => {
      const user_id = await currentUserId();
      const { error } = await supabase.from("habits").insert({
        user_id,
        name: input.name,
        icon: input.icon || "✅",
        target_days: days,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      setOpen(false);
      setDays([0, 1, 2, 3, 4, 5, 6]);
      toast.success("Hábito criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: string; completed: boolean }) => {
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("habit_logs")
        .upsert(
          { habit_id: habitId, user_id, log_date: today, completed },
          { onConflict: "habit_id,log_date" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habit_logs"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito arquivado");
    },
  });

  const logsByHabit = new Map<string, Set<string>>();
  for (const log of logs.data ?? []) {
    if (!log.completed) continue;
    const set = logsByHabit.get(log.habit_id) ?? new Set<string>();
    set.add(log.log_date);
    logsByHabit.set(log.habit_id, set);
  }

  return (
    <>
      <PageHeader
        title="Hábitos"
        subtitle="Check-in diário e sequências calculadas nos dias que você definiu."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Novo hábito
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo hábito</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  createHabit.mutate({
                    name: String(f.get("name")),
                    icon: String(f.get("icon") || "✅"),
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="habit-name">Nome</Label>
                  <Input id="habit-name" name="name" required placeholder="Estudei hoje" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="habit-icon">Ícone</Label>
                  <Input id="habit-icon" name="icon" defaultValue="📚" maxLength={4} />
                </div>
                <div className="space-y-2">
                  <Label>Dias da semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setDays((prev) =>
                            prev.includes(index)
                              ? prev.filter((d) => d !== index)
                              : [...prev, index].sort(),
                          )
                        }
                        className={
                          days.includes(index)
                            ? "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                            : "rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground"
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={days.length === 0}>
                  Criar hábito
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-3">
        {(habits.data ?? []).length === 0 && !habits.isLoading && (
          <EmptyState>Nenhum hábito ainda. Crie o primeiro para começar sua sequência.</EmptyState>
        )}
        {(habits.data ?? []).map((habit) => {
          const done = logsByHabit.get(habit.id) ?? new Set<string>();
          const streak = computeStreak(habit.target_days ?? [], done);
          const checked = done.has(today);
          const expectedToday = (habit.target_days ?? []).includes(new Date().getDay());
          return (
            <div key={habit.id} className="surface-card flex items-center gap-4 p-4">
              <Checkbox
                checked={checked}
                onCheckedChange={(value) =>
                  toggle.mutate({ habitId: habit.id, completed: value === true })
                }
                aria-label={`Check-in de ${habit.name}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  <span className="mr-2">{habit.icon}</span>
                  {habit.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(habit.target_days ?? []).map((d) => WEEKDAYS[d]).join(", ")}
                  {!expectedToday && " · hoje não é dia previsto"}
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm text-warning">
                <Flame className="size-4" /> {streak}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => archive.mutate(habit.id)}
                aria-label="Arquivar"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}