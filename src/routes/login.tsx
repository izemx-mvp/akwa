import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { ArrowRight, Briefcase, ShieldCheck, Sparkles, Layers, Zap, ChartNoAxesCombined } from "lucide-react";

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
        <div className="relative z-10" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-6 border border-white/10">
            <Sparkles className="h-3.5 w-3.5" /> La plateforme intelligente de pilotage Export
          </div>
          <h1 className="text-4xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.08]">
            Toute votre activité export.
            <br />
            <span className="text-primary-glow">Une seule plateforme.</span>
            <br />
            Une intelligence augmentée.
          </h1>
          <p className="mt-6 text-white/70 text-base leading-relaxed max-w-lg">
            AKWA AI centralise et digitalise l'ensemble du cycle export, de la commande client jusqu'à la facturation et l'expédition. Une plateforme unique qui connecte clients, équipes, produits, pricing, devis, opérations et données pour gagner en visibilité, en rapidité et en performance.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
            <span>Du portail client au back-office AKWA, toute la chaîne export est connectée.</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-white/70">
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">Portail Client</span>
            <span className="text-primary-glow">↔</span>
            <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-medium">AKWA AI</span>
            <span className="text-primary-glow">↔</span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">Back-office AKWA</span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-lg">
            {[
              { icon: Layers, title: "Centraliser", text: "Clients, produits, commandes, devis, factures et opérations réunis dans un même environnement." },
              { icon: Zap, title: "Automatiser", text: "Fluidifier les processus, réduire les tâches manuelles et accélérer le traitement des opérations export." },
              { icon: Sparkles, title: "Optimiser par l'IA", text: "Des agents spécialisés accompagnent les équipes dans le pricing, la marge, les devis, le chargement et les opérations export." },
              { icon: ChartNoAxesCombined, title: "Piloter", text: "Suivre les performances, les clients, les revenus, les marges et les opérations grâce à une donnée centralisée." },
            ].map((a) => (
              <div key={a.title} className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4 hover:border-white/20 transition-smooth">
                <a.icon className="h-4 w-4 text-primary-glow mb-2" />
                <div className="text-sm font-semibold leading-tight">{a.title}</div>
                <div className="mt-1 text-[11px] text-white/60 leading-snug">{a.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/50">© AKWA AI · Suite d'intelligence export</div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-14 bg-background">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo size="lg" className="scale-125" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-center">
            {`'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                            \n                                            I have approved the plan`}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground text-center">
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
