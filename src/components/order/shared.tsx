import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusMeta, type ExportStatus } from "@/lib/export-order-store";

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  dense,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card overflow-hidden", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {Icon && (
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className={cn(dense ? "" : "p-4")}>{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: ExportStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", meta.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {status}
    </span>
  );
}

const toneCls: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
  info: "bg-ai/15 text-ai",
  primary: "bg-primary/10 text-primary",
};

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneCls;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium", toneCls[tone], className)}>
      {children}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "primary",
  progress,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  progress?: number;
}) {
  const ring: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/15",
    danger: "text-destructive bg-destructive/10",
    info: "text-ai bg-ai/10",
  };
  const bar: Record<string, string> = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    info: "bg-ai",
  };
  return (
    <div className="group rounded-xl border border-border bg-card p-3.5 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("grid h-6 w-6 place-items-center rounded-md", ring[tone])}>
          <Icon className="h-3 w-3" />
        </span>
      </div>
      <div className="mt-2 text-lg font-bold leading-tight tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      {progress !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", bar[tone])} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

export function MiniBar({ pct, tone = "primary", className }: { pct: number; tone?: string; className?: string }) {
  const bar: Record<string, string> = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    info: "bg-ai",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", bar[tone] ?? bar.primary)} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export function Field({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="border-b border-dashed border-border/70 py-2 last:border-0">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-sm", strong ? "font-semibold" : "")}>{value}</dd>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
