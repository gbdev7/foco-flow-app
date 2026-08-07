import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, subjectMap, useSubjects } from "@/hooks/use-app-data";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDayLabel, SUBJECT_COLORS, toISODate } from "@/lib/study";

export const Route = createFileRoute("/_authenticated/anotacoes")({
  head: () => ({
    meta: [
      { title: "Anotações — Foco" },
      { name: "description", content: "Registre resumos por disciplina e busque por conteúdo." },
      { property: "og:title", content: "Anotações — Foco" },
      {
        property: "og:description",
        content: "Registre resumos por disciplina e busque por conteúdo.",
      },
    ],
  }),
  component: NotesPage,
});

type Note = {
  id: string;
  title: string;
  content: string;
  note_date: string;
  subject_id: string | null;
  updated_at: string;
};

function NotesPage() {
  const qc = useQueryClient();
  const subjects = useSubjects();
  const byId = subjectMap(subjects.data);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Note | null>(null);
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("none");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);

  const notes = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, note_date, subject_id, updated_at")
        .order("note_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });

  const save = useMutation({
    mutationFn: async (input: {
      id?: string;
      title: string;
      content: string;
      note_date: string;
    }) => {
      const payload = {
        title: input.title,
        content: input.content,
        note_date: input.note_date,
        subject_id: subjectId === "none" ? null : subjectId,
      };
      if (input.id) {
        const { error } = await supabase.from("notes").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const user_id = await currentUserId();
        const { error } = await supabase.from("notes").insert({ ...payload, user_id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      setOpen(false);
      setEditing(null);
      toast.success("Anotação salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Anotação excluída");
    },
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

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (notes.data ?? []).filter((n) => {
      const matchesSubject = filter === "all" || n.subject_id === filter;
      const matchesTerm =
        !term ||
        n.title.toLowerCase().includes(term) ||
        (n.content ?? "").toLowerCase().includes(term);
      return matchesSubject && matchesTerm;
    });
  }, [notes.data, search, filter]);

  function openEditor(note: Note | null) {
    setEditing(note);
    setSubjectId(note?.subject_id ?? "none");
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Anotações"
        subtitle="Resumos e registros de estudo organizados por disciplina."
        action={
          <Button onClick={() => openEditor(null)}>
            <Plus className="size-4" /> Nova anotação
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="mb-5 flex flex-wrap gap-3">
            <div className="relative min-w-56 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por título ou conteúdo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar anotações"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {(subjects.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {visible.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState>Nenhuma anotação encontrada.</EmptyState>
              </div>
            )}
            {visible.map((note) => {
              const subject = note.subject_id ? byId.get(note.subject_id) : undefined;
              return (
                <article key={note.id} className="surface-card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="text-left font-medium hover:text-primary"
                      onClick={() => openEditor(note)}
                    >
                      {note.title}
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(note.id)} aria-label="Excluir">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {note.content}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDayLabel(note.note_date)}</span>
                    {subject && (
                      <Badge variant="outline" style={{ borderColor: subject.color, color: subject.color }}>
                        {subject.name}
                      </Badge>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <section className="surface-card h-fit p-5">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar anotação" : "Nova anotação"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              save.mutate({
                id: editing?.id,
                title: String(f.get("title")),
                content: String(f.get("content") ?? ""),
                note_date: String(f.get("note_date")),
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="nt-title">Título</Label>
              <Input id="nt-title" name="title" required defaultValue={editing?.title ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nt-date">Data</Label>
                <Input
                  id="nt-date"
                  name="note_date"
                  type="date"
                  required
                  defaultValue={editing?.note_date ?? toISODate()}
                />
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
              <Label htmlFor="nt-content">Conteúdo</Label>
              <Textarea id="nt-content" name="content" rows={10} defaultValue={editing?.content ?? ""} />
            </div>
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
