import { type ReactNode, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Minus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { eur, eurCompact, pct1, num } from "@/lib/analytics-store";
import type { Group, WaterfallStep, FunnelStep, Alert as BizAlert } from "@/lib/analytics-store";

/* ------------------------------- KPI ------------------------------- */

export function Delta({ value, unit = "%", invert = false }: { value: number; unit?: string; invert?: boolean }) {
  const flat = Math.abs(value) < 0.05;
  const good = invert ? value < 0 : value > 0;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-semibold",
      flat ? "text-muted-foreground" : good ? "text-success" : "text-destructive",
    )}>
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? "+" : ""}{value.toFixed(1).replace(".", ",")}{unit}
    </span>
  );
}

export function KpiTile({
  label, value, delta, deltaUnit, invert, hint, accent, onClick, active,
}: {
  label: string; value: ReactNode; delta?: number; deltaUnit?: string; invert?: boolean;
  hint?: ReactNode; accent?: "primary" | "success" | "warning" | "danger" | "ai"; onClick?: () => void; active?: boolean;
}) {
  const bar = {
    primary: "bg-primary", success: "bg-success", warning: "bg-warning", danger: "bg-destructive", ai: "bg-ai",
  }[accent ?? "primary"];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border border-border bg-card p-4 text-left shadow-card transition-smooth",
        onClick && "hover:-translate-y-0.5 hover:shadow-elegant",
        active && "ring-2 ring-primary",
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-0.5", bar)} />
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {delta !== undefined && <Delta value={delta} unit={deltaUnit} invert={invert} />}
        {hint && <span className="truncate text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {onClick && <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-muted-foreground opacity-0 transition-smooth group-hover:opacity-100" />}
    </button>
  );
}

/* ------------------------------ blocs ------------------------------ */

export function Section({ title, description, action, children, className }: {
  title?: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Progress({ value, tone = "bg-primary" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Bullet({ label, value, goal, format = eurCompact, unit }: {
  label: string; value: number; goal: number; format?: (n: number) => string; unit?: string;
}) {
  const p = goal ? (value / goal) * 100 : 0;
  const tone = p >= 100 ? "bg-success" : p >= 85 ? "bg-primary" : p >= 70 ? "bg-warning" : "bg-destructive";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          <strong className="text-foreground">{unit ? `${value.toFixed(1).replace(".", ",")}${unit}` : format(value)}</strong>
          {" / "}{unit ? `${goal}${unit}` : format(goal)}
        </span>
      </div>
      <Progress value={p} tone={tone} />
      <div className="mt-1 text-[11px] text-muted-foreground">Progression {pct1(p)}</div>
    </div>
  );
}

/* ---------------------------- marge / seuils ---------------------------- */

export function marginTone(p: number, t: { critical: number; watch: number; ok: number }) {
  if (p < t.critical) return { tone: "danger" as const, label: "Critique", cls: "text-destructive" };
  if (p < t.watch) return { tone: "warning" as const, label: "À surveiller", cls: "text-warning" };
  if (p < t.ok) return { tone: "info" as const, label: "Correct", cls: "text-primary" };
  return { tone: "success" as const, label: "Bonne rentabilité", cls: "text-success" };
}

export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "success" | "warning" | "danger" | "info" | "ai" }) {
  const map = {
    muted: "bg-muted text-muted-foreground", success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning", danger: "bg-destructive/15 text-destructive",
    info: "bg-primary/10 text-primary", ai: "bg-ai/15 text-ai",
  } as const;
  return <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
}

/* ------------------------------ waterfall ------------------------------ */

export function Waterfall({ steps }: { steps: WaterfallStep[] }) {
  const start = steps[0]?.value ?? 1;
  let running = 0;
  return (
    <div className="space-y-2">
      {steps.map((s) => {
        const isEdge = s.type !== "minus";
        const from = isEdge ? 0 : running;
        if (s.type === "start") running = s.value;
        else if (s.type === "minus") running += s.value;
        const width = (Math.abs(s.value) / (start || 1)) * 100;
        const left = isEdge ? 0 : ((from + s.value) / (start || 1)) * 100;
        return (
          <div key={s.label} className="grid grid-cols-[150px_1fr_110px] items-center gap-3 text-xs">
            <span className={cn("truncate", isEdge && "font-semibold")}>{s.label}</span>
            <div className="relative h-5 rounded bg-muted/60">
              <div
                className={cn("absolute top-0 h-5 rounded", s.type === "start" ? "bg-primary" : s.type === "total" ? "bg-success" : "bg-destructive/70")}
                style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` }}
              />
            </div>
            <span className={cn("text-right font-mono", s.type === "minus" ? "text-destructive" : "font-semibold")}>
              {s.type === "minus" ? "−" : ""}{eur(Math.abs(s.value))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------- funnel -------------------------------- */

export function Funnel({ steps, onStep }: { steps: FunnelStep[]; onStep?: (s: FunnelStep) => void }) {
  const max = steps[0]?.value || 1;
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onStep?.(s)}
          className="group flex w-full items-center gap-3 text-left"
        >
          <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">{s.label}</span>
          <span className="relative h-8 flex-1 overflow-hidden rounded-lg bg-muted/50">
            <span
              className="absolute inset-y-0 left-0 flex items-center rounded-lg bg-gradient-to-r from-primary to-primary/70 px-3 text-xs font-semibold text-primary-foreground transition-all group-hover:brightness-110"
              style={{ width: `${Math.max(8, (s.value / max) * 100)}%` }}
            >
              {num(s.value)}
            </span>
          </span>
          <span className={cn("w-14 shrink-0 text-right text-xs font-semibold", i === 0 ? "text-muted-foreground" : s.rate >= 90 ? "text-success" : s.rate >= 75 ? "text-primary" : "text-warning")}>
            {i === 0 ? "—" : pct1(s.rate)}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- ranking ------------------------------- */

export type Column<T> = { key: string; label: string; align?: "left" | "right"; render: (row: T) => ReactNode; sort?: (row: T) => number | string };

export function DataTable<T>({ rows, columns, onRow, empty = "Aucune donnée sur la période sélectionnée.", max }: {
  rows: T[]; columns: Column<T>[]; onRow?: (row: T) => void; empty?: string; max?: number;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(-1);
  const col = columns.find((c) => c.key === sortKey);
  let list = [...rows];
  if (col?.sort) list.sort((a, b) => {
    const va = col.sort!(a), vb = col.sort!(b);
    return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
  });
  if (max) list = list.slice(0, max);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn("px-3 py-2 font-medium", c.align === "right" ? "text-right" : "text-left", c.sort && "cursor-pointer select-none hover:text-foreground")}
                onClick={() => c.sort && (sortKey === c.key ? setDir((d) => (d === 1 ? -1 : 1)) : (setSortKey(c.key), setDir(-1)))}
              >
                {c.label}{sortKey === c.key ? (dir === 1 ? " ↑" : " ↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {list.map((row, i) => (
            <tr key={i} className={cn("hover:bg-muted/30", onRow && "cursor-pointer")} onClick={() => onRow?.(row)}>
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 py-2", c.align === "right" && "text-right")}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
          {list.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-muted-foreground">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ bar ranking ------------------------------ */

export function RankBars({ groups, metric = "revenue", max = 8, onPick }: {
  groups: Group[]; metric?: "revenue" | "margin" | "litres" | "orders"; max?: number; onPick?: (g: Group) => void;
}) {
  const list = [...groups].sort((a, b) => (b[metric] as number) - (a[metric] as number)).slice(0, max);
  const top = (list[0]?.[metric] as number) || 1;
  const fmt = (v: number) => (metric === "orders" ? num(v) : metric === "litres" ? `${num(v)} L` : eurCompact(v));
  return (
    <div className="space-y-2.5">
      {list.map((g) => (
        <button key={g.key} type="button" onClick={() => onPick?.(g)} className="group w-full text-left">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium">{g.label}</span>
            <span className="shrink-0 font-mono text-muted-foreground">{fmt(g[metric] as number)} · {pct1(g.marginPct)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all group-hover:bg-primary/80" style={{ width: `${((g[metric] as number) / top) * 100}%` }} />
          </div>
        </button>
      ))}
      {list.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Aucune donnée.</p>}
    </div>
  );
}

/* ------------------------------- scatter ------------------------------- */

export function Scatter({ points, xLabel, yLabel, avgX, avgY }: {
  points: { key: string; label: string; x: number; y: number; r: number; meta: ReactNode }[];
  xLabel: string; yLabel: string; avgX: number; avgY: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const maxX = Math.max(...points.map((p) => p.x), 1);
  const maxY = Math.max(...points.map((p) => p.y), 1) * 1.1;
  const maxR = Math.max(...points.map((p) => p.r), 1);
  return (
    <div className="relative h-[340px] w-full rounded-lg border border-border bg-muted/20">
      <div className="absolute inset-0" style={{ left: `${(avgX / maxX) * 100}%` }}>
        <div className="h-full w-px bg-border" />
      </div>
      <div className="absolute inset-x-0" style={{ bottom: `${(avgY / maxY) * 100}%` }}>
        <div className="h-px w-full bg-border" />
      </div>
      <span className="absolute left-2 top-2 text-[10px] text-muted-foreground">CA faible · forte marge → à développer</span>
      <span className="absolute right-2 top-2 text-[10px] text-success">CA élevé · forte marge → stratégiques</span>
      <span className="absolute bottom-2 left-2 text-[10px] text-muted-foreground">Faible priorité</span>
      <span className="absolute bottom-2 right-2 text-[10px] text-warning">CA élevé · faible marge → à optimiser</span>
      {points.map((p) => {
        const size = 8 + (p.r / maxR) * 16;
        return (
          <div
            key={p.key}
            className="absolute -translate-x-1/2 translate-y-1/2 cursor-pointer rounded-full border border-background bg-primary/70 transition-all hover:bg-primary"
            style={{ left: `${(p.x / maxX) * 100}%`, bottom: `${(p.y / maxY) * 100}%`, width: size, height: size }}
            onMouseEnter={() => setHover(p.key)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === p.key && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-52 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 text-[11px] shadow-elegant">
                <div className="mb-1 font-semibold">{p.label}</div>
                {p.meta}
              </div>
            )}
          </div>
        );
      })}
      <span className="absolute -bottom-5 right-0 text-[10px] text-muted-foreground">{xLabel}</span>
      <span className="absolute -top-5 left-0 text-[10px] text-muted-foreground">{yLabel}</span>
    </div>
  );
}

/* ------------------------------- alertes ------------------------------- */

export function AlertCard({ alert, onClick }: { alert: BizAlert; onClick?: () => void }) {
  const tone = {
    danger: "border-destructive/40 bg-destructive/5", warning: "border-warning/40 bg-warning/5",
    info: "border-primary/40 bg-primary/5", success: "border-success/40 bg-success/5",
  }[alert.tone];
  const dot = { danger: "bg-destructive", warning: "bg-warning", info: "bg-primary", success: "bg-success" }[alert.tone];
  const body = (
    <div className={cn("flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-smooth hover:shadow-card", tone)}>
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot)} />
      <div className="min-w-0">
        <div className="text-sm font-semibold">{alert.title}</div>
        <div className="text-xs text-muted-foreground">{alert.detail}</div>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
  if (alert.to) return <Link to={alert.to} className="block">{body}</Link>;
  return <button type="button" onClick={onClick} className="block w-full">{body}</button>;
}

/* ------------------------------ drill-down ------------------------------ */

export function DrillSheet({ open, onOpenChange, title, description, children }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-4 space-y-4 pb-10">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function MiniStat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-sm font-semibold", tone)}>{value}</div>
    </div>
  );
}
