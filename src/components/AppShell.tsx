import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, LayoutDashboard, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";

export type NavItem = {
  to: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  to?: string;
  items: NavItem[];
  badge?: string;
};

const isPathActive = (pathname: string, to: string) =>
  pathname === to || (to !== "/" && pathname.startsWith(to + "/"));

export function AppShell({
  nav,
  groups,
  title,
  children,
  accent,
  notifications,
  user,
}: {
  nav?: NavItem[];
  groups?: NavGroup[];
  title: string;
  children: ReactNode;
  accent?: ReactNode;
  notifications?: ReactNode;
  user?: { name: string; role: string; initials: string };
}) {

  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    auth.signOut();
    navigate({ to: "/login" });
  };

  const activeGroup = useMemo(
    () => groups?.find((g) => g.items.some((i) => isPathActive(location.pathname, i.to)))?.label ?? null,
    [groups, location.pathname],
  );
  const [open, setOpen] = useState<string[]>(activeGroup ? [activeGroup] : []);
  useEffect(() => {
    if (activeGroup) setOpen((prev) => (prev.includes(activeGroup) ? prev : [...prev, activeGroup]));
  }, [activeGroup]);

  const toggle = (label: string) =>
    setOpen((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  return (
    <div className="flex min-h-screen w-full bg-gradient-subtle">
      <aside className="hidden md:flex w-64 flex-col bg-gradient-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Logo variant="light" size="lg" />
        </div>
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/40 mt-2">{title}</div>
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto pb-4">
          {nav?.map((item) => {
            const active = isPathActive(location.pathname, item.to) || location.pathname === item.to;
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
                {item.icon && <item.icon className={cn("h-4 w-4", active && "text-primary-glow")} />}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary-glow/20 text-primary-glow">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {groups?.map((group) => {
            const expanded = open.includes(group.label);
            const groupActive = group.items.some((i) => isPathActive(location.pathname, i.to)) ||
              (group.to ? location.pathname === group.to : false);
            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => toggle(group.label)}
                  aria-expanded={expanded}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-smooth",
                    groupActive ? "bg-sidebar-accent/70 text-white" : "text-white/70 hover:bg-sidebar-accent/50 hover:text-white",
                  )}
                >
                  <group.icon className={cn("h-4 w-4", groupActive && "text-primary-glow")} />
                  <span className="flex-1 text-left">{group.label}</span>
                  {group.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary-glow/20 text-primary-glow">
                      {group.badge}
                    </span>
                  )}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
                </button>
                {expanded && (
                  <div className="mt-1 mb-1 ml-5 border-l border-white/10 pl-2 space-y-0.5">
                    {group.to && (
                      <Link
                        to={group.to}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-smooth",
                          location.pathname === group.to ? "bg-sidebar-accent text-white" : "text-white/60 hover:text-white hover:bg-sidebar-accent/50",
                        )}
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Vue d'ensemble
                      </Link>
                    )}
                    {group.items.map((item) => {
                      const active = isPathActive(location.pathname, item.to) || location.pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-smooth",
                            active ? "bg-sidebar-accent text-white shadow-elegant" : "text-white/60 hover:text-white hover:bg-sidebar-accent/50",
                          )}
                        >
                          {item.icon && <item.icon className={cn("h-3.5 w-3.5", active && "text-primary-glow")} />}
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-glow/20 text-primary-glow">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
            {notifications ?? (
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            )}
            {user ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 py-1 pl-2 pr-1">
                <div className="hidden text-right leading-tight sm:block">
                  <div className="text-xs font-semibold">{user.name}</div>
                  <div className="text-[10px] text-muted-foreground">{user.role}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  {user.initials}
                </div>
                <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Se déconnecter" className="h-8 w-8">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                AK
              </div>
            )}
          </div>

        </header>
        <div className="flex-1 p-5 md:p-7 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}
