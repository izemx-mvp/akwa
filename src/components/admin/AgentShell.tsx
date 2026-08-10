import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/admin/ui";
import { AGENT_META, agentHub, orderContext, useAgentHub, type AgentKey } from "@/lib/agent-hub";
import { eur, pct } from "@/lib/backoffice-store";
import { boStore } from "@/lib/backoffice-store";

export function AgentHeader({
  agentKey, icon: Icon, status = "Actif", children,
}: { agentKey: AgentKey; icon: LucideIcon; status?: string; children?: ReactNode }) {
  const meta = AGENT_META[agentKey];
  return (
    <header className="rounded-xl border border-border bg-gradient-ai p-5 text-ai-foreground shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight md:text-xl">{meta.name}</h1>
              <span className="inline-flex items-center gap-1.5 rounded bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                {status}
              </span>
            </div>
            <p className="mt-0.5 max-w-2xl text-xs text-white/80">{meta.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </header>
  );
}

export function OrderContextPanel({ from }: { from: AgentKey }) {
  useAgentHub();
  const ctx = orderContext();
  const { orders } = boStore.get();
  return (
    <section className="rounded-xl border border-ai/30 bg-ai/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-ai" />
          Contexte de la commande — partagé entre tous les agents
        </div>
        <select
          value={ctx.order?.reference ?? ""}
          onChange={(e) => agentHub.selectOrder(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
        >
          {orders.map((o) => (
            <option key={o.reference} value={o.reference}>{o.reference}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Ctx label="Commande" value={ctx.order?.reference ?? "—"} />
        <Ctx label="Client" value={ctx.clientName} />
        <Ctx label="Montant" value={eur(ctx.revenue)} />
        <Ctx label="Marge" value={pct(ctx.marginPct)} />
        <Ctx label="Destination" value={ctx.destination} />
        <Ctx label="Conteneurs" value={ctx.containers} />
        <Ctx label="Statut" value={<Chip tone="info">{ctx.status}</Chip>} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(AGENT_META) as AgentKey[])
          .filter((k) => k !== from)
          .map((k) => (
            <CrossLink key={k} from={from} to={k} />
          ))}
      </div>
    </section>
  );
}

function Ctx({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

export function CrossLink({ from, to, label }: { from: AgentKey; to: AgentKey; label?: string }) {
  const meta = AGENT_META[to];
  return (
    <Link
      to={meta.route}
      onClick={() => agentHub.logHandoff(from, to, `Action croisée depuis ${AGENT_META[from].name}`)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-smooth hover:border-ai/50 hover:text-ai"
    >
      <span>{meta.emoji}</span>
      {label ?? meta.name}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

export function Explain({ title = "Explication de l'agent", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-ai/30 bg-ai/5 p-4">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ai">
        <Sparkles className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="text-sm leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}

export function Factors({ items }: { items: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((f) => (
        <span key={f} className="rounded bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">{f}</span>
      ))}
    </div>
  );
}

export function ToneBar({ value, target = 20, min = 15 }: { value: number; target?: number; min?: number }) {
  const tone = value < min ? "bg-destructive" : value < target ? "bg-warning" : "bg-success";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(0, Math.min(100, (value / 40) * 100))}%` }} />
    </div>
  );
}
