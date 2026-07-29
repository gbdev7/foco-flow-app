import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarRange, Timer, Repeat2, NotebookPen, BarChart3, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Foco — Organização de estudos e produtividade" },
      {
        name: "description",
        content:
          "Monte seu cronograma, controle hábitos, use o pomodoro e acompanhe estatísticas de estudo em um app só.",
      },
      { property: "og:title", content: "Foco — Organização de estudos e produtividade" },
      {
        property: "og:description",
        content:
          "Monte seu cronograma, controle hábitos, use o pomodoro e acompanhe estatísticas de estudo em um app só.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: CalendarRange, title: "Cronograma", text: "Blocos de estudo por disciplina, com status e reagendamento sem perder histórico." },
  { icon: CalendarDays, title: "Agenda", text: "Provas, trabalhos e compromissos com lembretes e blocos de revisão vinculados." },
  { icon: Timer, title: "Pomodoro", text: "Ciclos 25/5, 50/10 ou personalizados, sempre ligados a uma disciplina." },
  { icon: Repeat2, title: "Hábitos", text: "Check-in diário e sequências calculadas apenas nos dias que você definiu." },
  { icon: NotebookPen, title: "Anotações", text: "Notas por disciplina e etiquetas, com busca por texto." },
  { icon: BarChart3, title: "Estatísticas", text: "Horas estudadas, disciplina mais estudada e progresso das metas." },
];

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        style={{ backgroundImage: "var(--gradient-glow)" }}
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <span className="font-display text-lg font-semibold">Foco</span>
        <Button asChild variant="ghost">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="relative mx-auto max-w-3xl px-5 pb-16 pt-12 text-center sm:pt-20">
        <span className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          Estude com consistência, não com sorte
        </span>
        <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">
          Sua rotina de estudos, <span className="text-gradient">organizada de verdade</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Cronograma, agenda de provas, pomodoro, hábitos, anotações e estatísticas — tudo no mesmo
          lugar, sincronizado entre seus dispositivos.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/auth">Começar agora</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">Já tenho conta</Link>
          </Button>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-5xl gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article key={f.title} className="surface-card p-5">
            <f.icon className="size-5 text-primary" />
            <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </article>
        ))}
      </section>

      <footer className="relative border-t border-border px-5 py-8 text-center text-sm text-muted-foreground">
        Foco — organização de estudos e produtividade.
      </footer>
    </div>
  );
}
