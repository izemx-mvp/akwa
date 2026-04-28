import { cn } from "@/lib/utils";
import { Sparkles, type LucideIcon } from "lucide-react";

export function AgentBadge({
  name = "AI",
  icon: Icon = Sparkles,
  pulse = true,
  className,
}: {
  name?: string;
  icon?: LucideIcon;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gradient-ai px-2.5 py-1 text-[11px] font-medium text-ai-foreground shadow-ai",
        pulse && "animate-ai-pulse",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {name}
    </span>
  );
}
