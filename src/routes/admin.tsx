import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell, type NavItem } from "@/components/AppShell";
import { FloatingAssistant } from "@/components/FloatingAssistant";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { auth } from "@/lib/auth";
import { CURRENT_USER } from "@/lib/backoffice-store";
import {
  LayoutDashboard, ShoppingCart, FileText, Package, Users, Bot, Bell, Settings,
} from "lucide-react";

const nav: NavItem[] = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/commandes", label: "Commandes", icon: ShoppingCart },
  { to: "/admin/devis", label: "Devis", icon: FileText, badge: "IA" },
  { to: "/admin/produits", label: "Produits", icon: Package },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/agents", label: "Agents IA", icon: Bot, badge: "5" },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "Paramètres", icon: Settings },
];

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (auth.role !== "admin") {
      if (auth.role !== "client") throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell
      nav={nav}
      title="Back-office AKWA"
      notifications={<AdminNotifications />}
      user={{ name: CURRENT_USER.name, role: CURRENT_USER.role, initials: CURRENT_USER.initials }}
    >
      <Outlet />
      <FloatingAssistant />
    </AppShell>
  ),
});
