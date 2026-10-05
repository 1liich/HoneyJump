import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Emails Honeygain" },
      {
        name: "description",
        content: "Acesse sua conta para gerenciar seus emails salvos na nuvem.",
      },
      { property: "og:title", content: "Entrar — Emails Honeygain" },
      {
        property: "og:description",
        content: "Acesse sua conta para gerenciar seus emails salvos na nuvem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Confira seu email para confirmar a conta.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  const field =
    "h-11 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm text-card-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-primary/35 bg-primary/10 text-primary">
            <AtSign className="size-5" strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-none text-foreground">
              EMAILS <span className="text-primary">HONEYGAIN</span>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">Gerenciamento de contas Honeygain</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-6 text-sm font-bold uppercase text-foreground">
            {mode === "signin" ? "Acessar conta" : "Criar conta"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-caps mb-1 block" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className={field}
              />
            </div>
            <div>
              <label className="label-caps mb-1 block" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={field}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg font-bold"
            >
              {loading ? "Processando..." : mode === "signin" ? "Entrar" : "Cadastrar"}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            className="mt-3 h-11 w-full rounded-lg font-medium"
          >
            Continuar com Google
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full font-mono text-[11px] text-muted-foreground hover:text-primary"
          >
            {mode === "signin"
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Entrar"}
          </Button>
        </div>

        <p className="mt-5 text-center font-mono text-[10px] uppercase text-muted-foreground">
          Conexão segura · Lovable Cloud
        </p>
      </div>
    </div>
  );
}
