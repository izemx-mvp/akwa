import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export function StatCard({
  label,
  value,
  delta,
  icon,
  hint,
  intent = "default",
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon?: ReactNode;
  hint?: string;
  intent?: "default" | "success" | "warning" | "ai";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-smooth hover:shadow-elegant">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        {icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              intent === "ai" && "bg-gradient-ai text-ai-foreground",
              intent === "success" && "bg-success/10 text-success",
              intent === "warning" && "bg-warning/15 text-warning",
              intent === "default" && "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta && (
          <span
            className={cn(
              "font-medium",
              delta.startsWith("-") ? "text-destructive" : "text-success"
            )}
          >
            {delta}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
