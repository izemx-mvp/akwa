import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell, type NavItem } from "@/components/AppShell";
import { FloatingAssistant } from "@/components/FloatingAssistant";
import { auth } from "@/lib/auth";
import { LayoutDashboard, BookOpen, PlusCircle, ListOrdered, MessageSquare } from "lucide-react";

const nav: NavItem[] = [
  { to: "/client", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/client/catalog", label: "Catalogue", icon: BookOpen },
  { to: "/client/new-order", label: "Nouvelle commande", icon: PlusCircle, badge: "IA" },
  { to: "/client/orders", label: "Mes commandes", icon: ListOrdered },
  { to: "/client/ask", label: "Demander à AKWA AI", icon: MessageSquare, badge: "IA" },
];

export const Route = createFileRoute("/client")({
  beforeLoad: () => {
    if (auth.role !== "client") {
      if (auth.role !== "admin") throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell nav={nav} title="Portail Client">
      <Outlet />
      <FloatingAssistant />
    </AppShell>
  ),
});
