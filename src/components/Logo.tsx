import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, variant = "dark" }: { className?: string; variant?: "dark" | "light" }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
        <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-50 blur-md -z-10" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={cn("text-base font-bold tracking-tight", variant === "light" ? "text-white" : "text-foreground")}>
          AKWA <span className="text-gradient-ai">AI</span>
        </span>
        <span className={cn("text-[10px] uppercase tracking-wider", variant === "light" ? "text-white/60" : "text-muted-foreground")}>
          Intelligence Export
        </span>
      </div>
    </div>
  );
}
