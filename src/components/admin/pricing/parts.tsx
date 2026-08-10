import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TagPicker({
  options, selected, onToggle, empty = "Aucune option",
}: { options: string[]; selected: string[]; onToggle: (v: string) => void; empty?: string }) {
  if (!options.length) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-smooth",
              on ? "border-ai bg-ai/10 font-medium text-ai" : "border-border hover:border-ai/40",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function StepBar({ steps, current, onGo }: { steps: string[]; current: number; onGo: (i: number) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => (
        <li key={s}>
          <button
            type="button"
            onClick={() => onGo(i)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-smooth",
              i === current ? "bg-ai text-ai-foreground" : i < current ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
            )}
          >
            <span className="grid h-4 w-4 place-items-center rounded-full bg-black/10 text-[10px] font-bold">{i + 1}</span>
            {s}
          </button>
        </li>
      ))}
    </ol>
  );
}

export function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium">{label}</div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-sm font-bold", tone)}>{value}</div>
    </div>
  );
}
