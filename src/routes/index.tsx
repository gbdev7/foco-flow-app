import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InteractiveDots } from "@/components/ui/interactive-dots";
import { ServiceCard } from "@/components/ui/service-card";

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
  { emoji: "🗓️", title: "Cronograma", text: "Blocos de estudo por disciplina, com status e reagendamento sem perder histórico." },
  { emoji: "📌", title: "Agenda", text: "Provas, trabalhos e compromissos com lembretes e blocos de revisão vinculados." },
  { emoji: "⏱️", title: "Pomodoro", text: "Ciclos 25/5, 50/10 ou personalizados, sempre ligados a uma disciplina." },
  { emoji: "🔁", title: "Hábitos", text: "Check-in diário e sequências calculadas apenas nos dias que você definiu." },
  { emoji: "📝", title: "Anotações", text: "Notas por disciplina e etiquetas, com busca por texto." },
  { emoji: "📊", title: "Estatísticas", text: "Horas estudadas, disciplina mais estudada e progresso das metas." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-5 place-items-center rounded bg-foreground text-[11px] font-bold text-background">
              F
            </span>
            Foco
          </span>
        <Button asChild variant="ghost">
          <Link to="/auth">Entrar</Link>
        </Button>
        </div>
      </header>

      <section className="relative mx-auto max-w-3xl overflow-hidden px-5 pb-14 pt-16 text-center">
        <InteractiveDots spacing={26} dotRadius={1.6} repelRadius={120} repelStrength={0.5} />
        <div className="relative z-10">
          <span className="text-5xl">📚</span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Sua rotina de estudos, organizada de verdade
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
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-24">
        <hr className="notion-divider mb-8" />
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <ServiceCard
              key={f.title}
              icon={f.emoji}
              title={f.title}
              description={f.text}
              cta="Ver módulo"
            />
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-sm text-muted-foreground">
        Foco — organização de estudos e produtividade.
      </footer>
    </div>
  );
}
