import { type Recommendation } from "@/lib/agents";
import { cn } from "@/lib/utils";
import { Sparkles, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecommendationCard({ rec, onApply }: { rec: Recommendation; onApply?: () => void }) {
  const Icon = rec.severity === "warning" ? AlertTriangle : rec.severity === "success" ? CheckCircle2 : Info;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-smooth hover:shadow-elegant",
        rec.severity === "warning" && "border-warning/40 bg-warning/5",
        rec.severity === "success" && "border-success/40 bg-success/5",
        rec.severity === "info" && "border-ai/30 bg-ai/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            rec.severity === "warning" && "bg-warning/15 text-warning",
            rec.severity === "success" && "bg-success/15 text-success",
            rec.severity === "info" && "bg-ai/15 text-ai"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold">{rec.title}</h4>
            {rec.delta && (
              <span className="text-[11px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded">
                {rec.delta}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{rec.message}</p>
          {rec.cta && (
            <Button size="sm" variant="outline" className="mt-3 h-7 text-xs gap-1.5" onClick={onApply}>
              <Sparkles className="h-3 w-3" />
              {rec.cta}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
