import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell, type NavItem } from "@/components/AppShell";
import { FloatingAssistant } from "@/components/FloatingAssistant";
import { auth } from "@/lib/auth";
import { LayoutDashboard, ShoppingCart, Tag, BarChart3, Package, Ship, Bot, MessageSquare, Settings, Users } from "lucide-react";

const nav: NavItem[] = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Commandes", icon: ShoppingCart },
  { to: "/admin/pricing", label: "Pricing", icon: Tag, badge: "IA" },
  { to: "/admin/margins", label: "Marges", icon: BarChart3, badge: "IA" },
  { to: "/admin/container", label: "Optimisation Conteneur", icon: Package, badge: "IA" },
  { to: "/admin/export", label: "Export", icon: Ship },
  { to: "/admin/agents", label: "Agents IA", icon: Bot, badge: "5" },
  { to: "/admin/copilot", label: "Copilot", icon: MessageSquare, badge: "IA" },
  { to: "/admin/users", label: "Utilisateurs & Accès", icon: Users },
  { to: "/admin/settings", label: "Paramètres", icon: Settings },
];

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (auth.role !== "admin") {
      if (auth.role !== "client") throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell nav={nav} title="Cockpit Admin">
      <Outlet />
      <FloatingAssistant />
    </AppShell>
  ),
});
