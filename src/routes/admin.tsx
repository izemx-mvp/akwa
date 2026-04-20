import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell, type NavItem } from "@/components/AppShell";
import { auth } from "@/lib/auth";
import { LayoutDashboard, ShoppingCart, Tag, BarChart3, Package, Ship, Bot, MessageSquare, Settings } from "lucide-react";

const nav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/pricing", label: "Pricing", icon: Tag, badge: "AI" },
  { to: "/admin/margins", label: "Margins", icon: BarChart3, badge: "AI" },
  { to: "/admin/container", label: "Container Optimization", icon: Package, badge: "AI" },
  { to: "/admin/export", label: "Export", icon: Ship },
  { to: "/admin/agents", label: "AI Agents", icon: Bot, badge: "5" },
  { to: "/admin/copilot", label: "Copilot", icon: MessageSquare, badge: "AI" },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (auth.role !== "admin") {
      if (auth.role !== "client") throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell nav={nav} title="Admin Cockpit">
      <Outlet />
    </AppShell>
  ),
});
