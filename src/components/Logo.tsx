import { cn } from "@/lib/utils";
import logo from "@/assets/akwa-logo.png";

export function Logo({ className, variant = "dark" }: { className?: string; variant?: "dark" | "light" }) {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={logo}
        alt="AKWA Group"
        className={cn("h-9 w-auto object-contain", variant === "light" && "brightness-0 invert")}
      />
    </div>
  );
}
