import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, useSubjects } from "@/hooks/use-app-data";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUBJECT_COLORS } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Foco" },
      { name: "description", content: "Gerencie seu perfil e suas disciplinas." },
      { property: "og:title", content: "Configurações — Foco" },
      { property: "og:description", content: "Gerencie seu perfil e suas disciplinas." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const subjects = useSubjects();
  const [color, setColor] = useState(SUBJECT_COLORS[0]);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const id = await currentUserId();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, study_goal")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const saveProfile = useMutation({
    mutationFn: async (input: { name: string; study_goal: string }) => {
      const id = await currentUserId();
      const { error } = await supabase
        .from("profiles")
        .update({ name: input.name, study_goal: input.study_goal || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSubject = useMutation({
    mutationFn: async (name: string) => {
      const user_id = await currentUserId();
      const { error } = await supabase.from("subjects").insert({ user_id, name, color });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Disciplina criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });

  return (
    <>
      <PageHeader title="Configurações" subtitle="Perfil e disciplinas." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="mb-4 font-semibold">Perfil</h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              saveProfile.mutate({
                name: String(f.get("name")),
                study_goal: String(f.get("study_goal") ?? ""),
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="pf-name">Nome</Label>
              <Input id="pf-name" name="name" defaultValue={profile.data?.name ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-goal">Objetivo de estudo</Label>
              <Input
                id="pf-goal"
                name="study_goal"
                placeholder="Passar no vestibular"
                defaultValue={profile.data?.study_goal ?? ""}
              />
            </div>
            <Button type="submit">Salvar perfil</Button>
          </form>
        </section>

        <section className="surface-card p-5">
          <h2 className="mb-4 font-semibold">Disciplinas</h2>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              addSubject.mutate(String(f.get("name")));
              form.reset();
            }}
          >
            <div className="min-w-40 flex-1 space-y-2">
              <Label htmlFor="sb-name">Nome</Label>
              <Input id="sb-name" name="name" required placeholder="Matemática" />
            </div>
            <div className="flex gap-1.5">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  onClick={() => setColor(c)}
                  className={`size-6 rounded-full ${color === c ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Button type="submit">
              <Plus className="size-4" /> Adicionar
            </Button>
          </form>

          <ul className="mt-5 space-y-2">
            {(subjects.data ?? []).length === 0 && (
              <EmptyState>Nenhuma disciplina cadastrada.</EmptyState>
            )}
            {(subjects.data ?? []).map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-sm">{s.name}</span>
                <Button variant="ghost" size="icon" onClick={() => archiveSubject.mutate(s.id)} aria-label="Arquivar">
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}