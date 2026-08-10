import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell, type NavGroup, type NavItem } from "@/components/AppShell";
import { FloatingAssistant } from "@/components/FloatingAssistant";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { auth } from "@/lib/auth";
import { CURRENT_USER, useBackoffice } from "@/lib/backoffice-store";
import {
  LayoutDashboard, ShoppingCart, FileText, Package, Users, Bot, Bell, Settings,
  Briefcase, Ship, Wallet, Boxes, BarChart3, Tag, TrendingUp, FileCheck, Container,
  History, BookOpen, Receipt, Settings2, MessageSquare, ShieldCheck, Upload, PlusCircle, LineChart,
} from "lucide-react";

const dashboard: NavItem[] = [{ to: "/admin", label: "Tableau de bord", icon: LayoutDashboard }];

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (auth.role !== "admin") {
      if (auth.role !== "client") throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { orders, adminQuotes, notifications } = useBackoffice();

  const ordersToProcess = orders.filter((o) =>
    ["Commande reçue", "En attente", "En attente d'informations"].includes(o.status)).length;
  const quotesToSend = adminQuotes.filter((q) => q.status === "À valider client").length;
  const paymentsLate = orders.filter((o) => o.risk === "Élevé").length;
  const alerts = notifications.filter((n) => !n.read).length;

  const groups: NavGroup[] = [
    {
      label: "Commercial",
      icon: Briefcase,
      items: [
        { to: "/admin/commandes", label: "Commandes", icon: ShoppingCart, badge: ordersToProcess ? String(ordersToProcess) : undefined },
        { to: "/admin/devis", label: "Devis", icon: FileText, badge: quotesToSend ? String(quotesToSend) : undefined },
        { to: "/admin/clients", label: "Clients", icon: Users },
      ],
    },
    {
      label: "Catalogue",
      icon: Package,
      items: [
        { to: "/admin/produits", label: "Produits", icon: Boxes },
        { to: "/admin/produits/nouveau", label: "Nouveau produit", icon: PlusCircle },
        { to: "/admin/produits/import", label: "Import de catalogue", icon: Upload },
      ],
    },
    {
      label: "Opérations Export",
      icon: Ship,
      items: [
        { to: "/admin/export", label: "Suivi export", icon: FileCheck },
        { to: "/admin/container", label: "Conteneurs", icon: Container },
        { to: "/admin/orders", label: "Commandes en cours", icon: ShoppingCart },
      ],
    },
    {
      label: "Facturation",
      icon: Receipt,
      items: [
        { to: "/admin/facturation/factures", label: "Factures", icon: FileText },
        { to: "/admin/facturation/paiements", label: "Paiements", icon: Wallet },
      ],
    },
    {
      label: "Finance",
      icon: Wallet,
      items: [
        { to: "/admin/margins", label: "Marges & rentabilité", icon: BarChart3, badge: paymentsLate ? String(paymentsLate) : undefined },
        { to: "/admin/pricing", label: "Pricing catalogue", icon: Tag },
      ],
    },
    {
      label: "Agents IA",
      icon: Bot,
      to: "/admin/agents",
      badge: "5",
      items: [
        { to: "/admin/agents/devis", label: "Agent Devis", icon: FileText },
        { to: "/admin/agents/pricing", label: "Agent Pricing", icon: Tag },
        { to: "/admin/agents/marge", label: "Agent Marge", icon: TrendingUp },
        { to: "/admin/agents/export", label: "Agent Export", icon: Ship },
        { to: "/admin/agents/container-optimizer", label: "Agent Conteneur", icon: Container },
        { to: "/admin/agents/historique", label: "Historique IA", icon: History },
      ],
    },
    {
      label: "Pilotage",
      icon: LineChart,
      items: [
        { to: "/admin/analytics", label: "Analyse & KPI", icon: LineChart },
        { to: "/admin/copilot", label: "Copilote interne", icon: MessageSquare },
        { to: "/admin/knowledge", label: "Base de connaissances", icon: BookOpen },
        { to: "/admin/configuration-agents", label: "Configuration agents", icon: Settings2 },
        { to: "/admin/notifications", label: "Notifications", icon: Bell, badge: alerts ? String(alerts) : undefined },
      ],
    },
    {
      label: "Administration",
      icon: ShieldCheck,
      items: [
        { to: "/admin/users", label: "Utilisateurs & rôles", icon: Users },
        { to: "/admin/settings", label: "Paramètres", icon: Settings },
      ],
    },
  ];

  return (
    <AppShell
      nav={dashboard}
      groups={groups}
      title="Back-office AKWA"
      notifications={<AdminNotifications />}
      user={{ name: CURRENT_USER.name, role: CURRENT_USER.role, initials: CURRENT_USER.initials }}
    >
      <Outlet />
      <FloatingAssistant />
    </AppShell>
  );
}
