import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export function AppShell({
  nav,
  title,
  children,
  accent,
}: {
  nav: NavItem[];
  title: string;
  children: ReactNode;
  accent?: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-subtle">
      <aside className="hidden md:flex w-64 flex-col bg-gradient-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Logo variant="light" />
        </div>
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/40 mt-2">{title}</div>
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-smooth",
                  active
                    ? "bg-sidebar-accent text-white shadow-elegant"
                    : "text-white/70 hover:bg-sidebar-accent/60 hover:text-white"
                )}
              >
                <item.icon className={cn("h-4 w-4", active && "text-primary-glow")} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary-glow/20 text-primary-glow">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-sidebar-accent/60 hover:text-white transition-smooth"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{title}</span>
            {accent}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
              AK
            </div>
          </div>
        </header>
        <div className="flex-1 p-5 md:p-7 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}
