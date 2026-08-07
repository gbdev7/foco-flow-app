import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/hooks/use-app-data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Foco" },
      { name: "description", content: "Gerencie seu perfil e preferências." },
      { property: "og:title", content: "Configurações — Foco" },
      { property: "og:description", content: "Gerencie seu perfil e preferências." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();

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

  return (
    <>
      <PageHeader title="Configurações" subtitle="Perfil e preferências." />

      <section className="surface-card max-w-xl p-5">
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
    </>
  );
}
