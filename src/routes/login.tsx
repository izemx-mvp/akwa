import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { ArrowRight, Briefcase, ShieldCheck, Sparkles, TrendingUp, Package, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "AKWA AI — Connexion" },
      { name: "description", content: "Plateforme intelligente de pricing, commandes et optimisation export" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const enter = (role: "client" | "admin") => {
    auth.setRole(role);
    navigate({ to: role === "admin" ? "/admin" : "/client" });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="relative lg:w-1/2 bg-gradient-hero text-white p-10 lg:p-14 flex flex-col justify-between overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-ai/30 blur-3xl" />
        <div className="relative z-10">
          <Logo variant="light" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-5">
            <Sparkles className="h-3.5 w-3.5" /> Plateforme d'opérations augmentée par IA
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Pricing, commandes & optimisation <span className="text-primary-glow">intelligents</span> pour l'export
          </h1>
          <p className="mt-5 text-white/70 text-base leading-relaxed">
            AKWA AI déploie des agents autonomes sur le pricing, le chargement, les marges et la douane — chaque décision export devient une décision optimisée.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm">
            {[
              { icon: TrendingUp, label: "Pricing Advisor" },
              { icon: Package, label: "Container Optimizer" },
              { icon: BarChart3, label: "Margin Analyst" },
            ].map((a) => (
              <div key={a.label} className="rounded-lg bg-white/5 backdrop-blur border border-white/10 p-3">
                <a.icon className="h-4 w-4 text-primary-glow mb-2" />
                <div className="text-[11px] text-white/80 leading-tight">{a.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs text-white/50">© AKWA AI · Suite d'intelligence export</div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-14 bg-background">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold tracking-tight">Bienvenue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choisissez comment accéder à la plateforme.
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => enter("client")}
              className="group w-full text-left rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-elegant transition-smooth"
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Entrer en tant que Client</div>
                  <div className="text-xs text-muted-foreground">Commander, suivre les expéditions, interroger AKWA AI.</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-smooth" />
              </div>
            </button>

            <button
              onClick={() => enter("admin")}
              className="group w-full text-left rounded-xl border border-border bg-card p-5 hover:border-ai hover:shadow-ai transition-smooth"
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-lg bg-gradient-ai text-ai-foreground flex items-center justify-center shadow-glow">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    Entrer en tant qu'Admin
                    <span className="text-[10px] uppercase tracking-wider bg-ai/15 text-ai px-1.5 py-0.5 rounded">Cockpit IA</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Pricing, marges, optimisation, agents IA.</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-ai transition-smooth" />
              </div>
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">prototype démo</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="ghost" className="mt-4 w-full text-xs text-muted-foreground" onClick={() => enter("admin")}>
            Ignorer et explorer le cockpit admin
          </Button>
        </div>
      </div>
    </div>
  );
}
