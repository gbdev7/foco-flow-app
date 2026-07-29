import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Foco" },
      { name: "description", content: "Acesse sua conta para organizar seus estudos no Foco." },
      { property: "og:title", content: "Entrar — Foco" },
      {
        property: "og:description",
        content: "Acesse sua conta para organizar seus estudos no Foco.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(email: string, password: string) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Não foi possível entrar", { description: error.message });
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(name: string, email: string, password: string) {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return toast.error("Não foi possível criar a conta", { description: error.message });
    if (data.session) return navigate({ to: "/dashboard", replace: true });
    toast.success("Conta criada", { description: "Confirme seu e-mail para continuar." });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error("Falha no login com Google");
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--gradient-glow)" }}
      />
      <div className="surface-card relative w-full max-w-md p-7">
        <Link to="/" className="font-display text-xl font-semibold">
          Foco
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu cronograma, hábitos e pomodoro em um só lugar.
        </p>

        <Tabs defaultValue="login" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                signIn(String(f.get("email")), String(f.get("password")));
              }}
            >
              <Field id="login-email" name="email" type="email" label="E-mail" />
              <Field id="login-password" name="password" type="password" label="Senha" />
              <Button type="submit" className="w-full" disabled={loading}>
                Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                signUp(String(f.get("name")), String(f.get("email")), String(f.get("password")));
              }}
            >
              <Field id="signup-name" name="name" type="text" label="Nome" />
              <Field id="signup-email" name="email" type="email" label="E-mail" />
              <Field
                id="signup-password"
                name="password"
                type="password"
                label="Senha"
                minLength={6}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                Criar conta
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full" onClick={google}>
          Continuar com Google
        </Button>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} required {...props} />
    </div>
  );
}