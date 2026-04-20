import { createFileRoute } from "@tanstack/react-router";
import { agents } from "@/lib/agents";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/agents")({
  head: () => ({ meta: [{ title: "Agents IA — AKWA AI" }] }),
  component: AgentsPage,
});

const statusLabel: Record<string, string> = {
  active: "actif",
  analyzing: "analyse",
  idle: "veille",
};

function AgentsPage() {
  return (
    <div className="space-y-6 max-w-[1500px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agents IA</h1>
        <p className="text-sm text-muted-foreground">Votre force de travail autonome — analyse, recommandation, optimisation 24/7.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {agents.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card shadow-card hover:shadow-elegant transition-smooth overflow-hidden">
            <div className="bg-gradient-ai p-5 text-ai-foreground relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <a.icon className="h-6 w-6" />
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded",
                  a.status === "active" && "bg-success/20 text-white",
                  a.status === "analyzing" && "bg-white/20 text-white",
                  a.status === "idle" && "bg-white/10 text-white/70"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full",
                    a.status === "active" && "bg-success animate-pulse",
                    a.status === "analyzing" && "bg-white animate-pulse",
                    a.status === "idle" && "bg-white/50"
                  )} />
                  {statusLabel[a.status]}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold relative z-10">{a.name}</h3>
              <div className="text-xs text-white/80 relative z-10">{a.role}</div>
            </div>

            <div className="p-5">
              <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>

              <div className="mt-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Capacités</div>
                <div className="flex flex-wrap gap-1.5">
                  {a.capabilities.map((c) => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{c}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-muted/40 p-3 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px animate-shimmer" />
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-ai animate-pulse" /> Actions récentes
                </div>
                <ul className="space-y-1.5">
                  {a.recentActions.map((r) => (
                    <li key={r} className="text-xs text-foreground/80 flex gap-2">
                      <span className="text-ai">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
