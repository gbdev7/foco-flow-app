import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  NotebookPen,
  Repeat2,
  Timer,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cronograma", label: "Cronograma", icon: CalendarRange },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/anotacoes", label: "Anotações", icon: NotebookPen },
  { to: "/habitos", label: "Hábitos", icon: Repeat2 },
  { to: "/pomodoro", label: "Pomodoro", icon: Timer },
  { to: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <Brand />
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} active={pathname === item.to} />
          ))}
        </nav>
        <Button variant="ghost" className="justify-start gap-3" onClick={signOut}>
          <LogOut className="size-4" /> Sair
        </Button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      {open && (
        <div className="fixed inset-x-0 top-[57px] z-30 border-b border-border bg-sidebar p-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                active={pathname === item.to}
                onClick={() => setOpen(false)}
              />
            ))}
            <Button variant="ghost" className="justify-start gap-3" onClick={signOut}>
              <LogOut className="size-4" /> Sair
            </Button>
          </nav>
        </div>
      )}

      <main className="px-4 pb-16 pt-6 lg:ml-60 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 px-1">
      <span
        className="grid size-8 place-items-center rounded-xl text-sm font-bold text-primary-foreground"
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        F
      </span>
      <span className="font-display text-lg font-semibold">Foco</span>
    </Link>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className={cn("size-4", active && "text-primary")} />
      {label}
    </Link>
  );
}