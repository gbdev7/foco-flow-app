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
  ChevronsLeft,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard, emoji: "🏠" },
  { to: "/cronograma", label: "Cronograma", icon: CalendarRange, emoji: "🗓️" },
  { to: "/agenda", label: "Agenda", icon: CalendarDays, emoji: "📌" },
  { to: "/anotacoes", label: "Anotações", icon: NotebookPen, emoji: "📝" },
  { to: "/habitos", label: "Hábitos", icon: Repeat2, emoji: "🔁" },
  { to: "/pomodoro", label: "Pomodoro", icon: Timer, emoji: "⏱️" },
  { to: "/estatisticas", label: "Estatísticas", icon: BarChart3, emoji: "📊" },
] as const;

const SETTINGS_ITEM = {
  to: "/configuracoes",
  label: "Configurações",
  icon: Settings,
  emoji: "⚙️",
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = [...NAV, SETTINGS_ITEM].find((i) => i.to === pathname);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar px-2 py-3 transition-[width] duration-150 lg:flex",
          collapsed ? "w-[56px]" : "w-[248px]",
        )}
      >
        <div className="flex items-center justify-between gap-1 px-1">
          <Brand compact={collapsed} />
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Recolher menu"
            className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-sidebar-accent"
          >
            <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {!collapsed && (
          <button
            type="button"
            className="mt-3 flex items-center gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent"
          >
            <Search className="size-4" /> Buscar
          </button>
        )}

        <nav className="mt-3 flex flex-1 flex-col gap-px overflow-y-auto">
          {!collapsed && <SectionLabel>Páginas</SectionLabel>}
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} active={pathname === item.to} collapsed={collapsed} />
          ))}
          <div className="my-2 h-px bg-sidebar-border" />
          <NavItem {...SETTINGS_ITEM} active={pathname === SETTINGS_ITEM.to} collapsed={collapsed} />
        </nav>

        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-2 rounded px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && "Sair"}
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/90 px-3 py-2 backdrop-blur lg:hidden">
        <Brand compact={false} />
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      {open && (
        <div className="fixed inset-x-0 top-[49px] z-30 border-b border-border bg-sidebar p-2 lg:hidden">
          <nav className="flex flex-col gap-px">
            {[...NAV, SETTINGS_ITEM].map((item) => (
              <NavItem
                key={item.to}
                {...item}
                active={pathname === item.to}
                collapsed={false}
                onClick={() => setOpen(false)}
              />
            ))}
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </nav>
        </div>
      )}

      <div className={cn("transition-[padding] duration-150", collapsed ? "lg:pl-[56px]" : "lg:pl-[248px]")}>
        <div className="sticky top-0 z-20 hidden h-11 items-center gap-2 border-b border-border bg-background/90 px-4 text-sm text-muted-foreground backdrop-blur lg:flex">
          <span className="text-base leading-none">{current?.emoji ?? "📄"}</span>
          <span className="truncate text-foreground">{current?.label ?? "Página"}</span>
        </div>
        <main className="px-4 pb-24 pt-6 lg:px-12">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function Brand({ compact }: { compact: boolean }) {
  return (
    <Link to="/dashboard" className="flex min-w-0 items-center gap-2 rounded px-1 py-1 hover:bg-sidebar-accent">
      <span className="grid size-5 shrink-0 place-items-center rounded bg-foreground text-[11px] font-bold text-background">
        F
      </span>
      {!compact && <span className="truncate text-sm font-semibold">Foco</span>}
    </Link>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  emoji,
  active,
  collapsed,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  emoji: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center gap-2 rounded px-2 py-1 text-sm text-sidebar-foreground transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
      )}
    >
      {collapsed ? (
        <Icon className="size-4" />
      ) : (
        <>
          <span className="w-4 shrink-0 text-center text-[13px] leading-none">{emoji}</span>
          <span className="truncate">{label}</span>
        </>
      )}
    </Link>
  );
}