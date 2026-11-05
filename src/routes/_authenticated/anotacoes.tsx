import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, subjectMap, useSubjects } from "@/hooks/use-app-data";
import { PageHeader, EmptyState } from "@/components/page-header";
import { NoteEditor, type NoteEditorHandle } from "@/components/note-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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

/** Legacy notes are plain text; convert to HTML so they open correctly in the rich editor. */
function toHtml(raw: string): string {
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  const escaped = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br>");
}

/** Plain-text preview of HTML note content for the list. */
function previewText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").trim();
}

function NotesPage() {
  const qc = useQueryClient();
  const subjects = useSubjects();
  const byId = subjectMap(subjects.data);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [color, setColor] = useState(SUBJECT_COLORS[0]);

  const notes = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, note_date, subject_id, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (notes.data ?? []).filter((n) => {
      const matchesSubject = filter === "all" || n.subject_id === filter;
      const matchesTerm =
        !term ||
        n.title.toLowerCase().includes(term) ||
        previewText(n.content).toLowerCase().includes(term);
      return matchesSubject && matchesTerm;
    });
  }, [notes.data, search, filter]);

  const selected = (notes.data ?? []).find((n) => n.id === selectedId) ?? null;

  const createNote = useMutation({
    mutationFn: async () => {
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("notes")
        .insert({ user_id, title: "", content: "", note_date: toISODate() })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      setSelectedId(id);
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
      setSelectedId(null);
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

  return (
    <>
      <PageHeader
        title="Anotações"
        subtitle="Resumos e registros de estudo organizados por disciplina."
        action={
          <Button onClick={() => createNote.mutate()} disabled={createNote.isPending}>
            <Plus className="size-4" /> Nova anotação
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* Note list — iPhone Notes style left column */}
        <aside className="surface-card flex max-h-[calc(100vh-15rem)] flex-col overflow-hidden">
          <div className="space-y-2 border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar anotações"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full">
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

          <div className="flex-1 overflow-y-auto p-2">
            {visible.length === 0 && (
              <EmptyState>Nenhuma anotação encontrada.</EmptyState>
            )}
            {visible.map((note) => {
              const subject = note.subject_id ? byId.get(note.subject_id) : undefined;
              const preview = previewText(note.content);
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedId(note.id)}
                  className={cn(
                    "notion-row block w-full rounded-md px-3 py-2.5 text-left",
                    selectedId === note.id && "bg-accent",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {note.title || "Nova anotação"}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDayLabel(note.note_date)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {preview || "Sem conteúdo adicional"}
                  </p>
                  {subject && (
                    <span
                      className="mt-1 inline-block rounded-full border px-1.5 py-px text-[10px]"
                      style={{ borderColor: subject.color, color: subject.color }}
                    >
                      {subject.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Subjects management */}
          <details className="border-t border-border">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">
              Disciplinas
            </summary>
            <div className="space-y-3 px-3 pb-3">
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const f = new FormData(form);
                  addSubject.mutate(String(f.get("name")));
                  form.reset();
                }}
              >
                <div className="min-w-28 flex-1 space-y-1">
                  <Label htmlFor="sb-name" className="text-xs">
                    Nome
                  </Label>
                  <Input id="sb-name" name="name" required placeholder="Matemática" className="h-8 text-sm" />
                </div>
                <div className="flex gap-1">
                  {SUBJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Cor ${c}`}
                      onClick={() => setColor(c)}
                      className={cn(
                        "size-5 rounded-full",
                        color === c && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <Button type="submit" size="sm" className="h-8">
                  <Plus className="size-3.5" />
                </Button>
              </form>
              <ul className="space-y-1">
                {(subjects.data ?? []).map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="flex-1 truncate">{s.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => archiveSubject.mutate(s.id)}
                      aria-label="Arquivar"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </aside>

        {/* Editor pane */}
        {selected ? (
          <NoteDetail
            key={selected.id}
            note={selected}
            subjects={subjects.data ?? []}
            onDelete={() => remove.mutate(selected.id)}
          />
        ) : (
          <div className="surface-card grid min-h-96 place-items-center">
            <div className="text-center text-muted-foreground">
              <p className="text-4xl">📝</p>
              <p className="mt-2 text-sm">Selecione uma anotação ou crie uma nova.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function NoteDetail({
  note,
  subjects,
  onDelete,
}: {
  note: Note;
  subjects: { id: string; name: string; color: string }[];
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const editorRef = useRef<NoteEditorHandle>(null);
  const [title, setTitle] = useState(note.title);
  const [noteDate, setNoteDate] = useState(note.note_date);
  const [subjectId, setSubjectId] = useState(note.subject_id ?? "none");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "idle">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title: note.title, note_date: note.note_date, subject_id: note.subject_id });

  const save = useMutation({
    mutationFn: async () => {
      const content = editorRef.current?.getContent() ?? note.content;
      const { error } = await supabase
        .from("notes")
        .update({
          title: latest.current.title,
          note_date: latest.current.note_date,
          subject_id: latest.current.subject_id,
          content,
        })
        .eq("id", note.id);
      if (error) throw error;
    },
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (e: Error) => {
      setSaveState("idle");
      toast.error(e.message);
    },
  });

  function scheduleSave(patch: Partial<typeof latest.current>) {
    latest.current = { ...latest.current, ...patch };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save.mutate(), 800);
  }

  // Flush pending save when leaving the note.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <section className="surface-card flex max-h-[calc(100vh-15rem)] flex-col overflow-hidden">
      {/* Note meta bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5">
        <input
          type="date"
          value={noteDate}
          onChange={(e) => {
            setNoteDate(e.target.value);
            scheduleSave({ note_date: e.target.value });
          }}
          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
          aria-label="Data da anotação"
        />
        <Select
          value={subjectId}
          onValueChange={(v) => {
            setSubjectId(v);
            scheduleSave({ subject_id: v === "none" ? null : v });
          }}
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem disciplina</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          {saveState === "saving" ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Salvando…
            </>
          ) : (
            <>
              <Check className="size-3.5" /> Salvo
            </>
          )}
        </span>
        <Button variant="ghost" size="icon" className="size-8" onClick={onDelete} aria-label="Excluir anotação">
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Title + body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave({ title: e.target.value });
          }}
          placeholder="Título"
          className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50"
          aria-label="Título da anotação"
        />
        <div className="mt-3">
          <NoteEditor
            ref={editorRef}
            value={toHtml(note.content)}
            onChange={() => scheduleSave({})}
          />
        </div>
      </div>
    </section>
  );
}
