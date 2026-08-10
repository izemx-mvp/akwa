import { cn } from "@/lib/utils";
import logo from "@/assets/akwa-logo.png";

export function Logo({
  className,
  variant = "dark",
  size = "md",
}: {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}) {
  const height = size === "sm" ? "h-10" : size === "lg" ? "h-20" : "h-14";
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={logo}
        alt="AKWA Group"
        className={cn(`${height} w-auto object-contain`, variant === "light" && "brightness-0 invert")}
      />
    </div>
  );
}
