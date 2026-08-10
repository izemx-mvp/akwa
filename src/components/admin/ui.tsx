import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function Kpi({
  label, value, sub, icon: Icon, tone = "bg-primary/10 text-primary",
}: { label: string; value: ReactNode; sub?: ReactNode; icon?: LucideIcon; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {Icon && (
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", tone)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight md:text-2xl">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Panel({
  title, action, children, className, description,
}: { title?: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 truncate text-sm font-medium", mono && "font-mono")}>{value ?? "—"}</div>
    </div>
  );
}

export function Chip({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "success" | "warning" | "danger" | "info" | "ai" }) {
  const map: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-primary/10 text-primary",
    ai: "bg-ai/15 text-ai",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
}

export const orderStatusTone: Record<string, "muted" | "success" | "warning" | "danger" | "info" | "ai"> = {
  "Commande reçue": "warning",
  "En attente d'informations": "warning",
  "En attente": "muted",
  Refusée: "danger",
  "Commande validée par AKWA": "info",
  "Devis envoyé – En attente client": "ai",
  "Devis accepté": "success",
  "Révision devis": "warning",
  "En préparation": "info",
  "En transit": "info",
  Livrée: "success",
};

export const quoteStatusTone: Record<string, "muted" | "success" | "warning" | "danger" | "info" | "ai"> = {
  Brouillon: "muted",
  Validé: "info",
  Envoyé: "ai",
  "À valider client": "warning",
  Accepté: "success",
  Refusé: "danger",
  Expiré: "muted",
  Remplacé: "muted",
};

export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {items.map((i, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <span>/</span>}
          {i.to ? <a href={i.to} className="hover:text-foreground">{i.label}</a> : <span className="text-foreground">{i.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Bar({ value, tone = "bg-primary" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
