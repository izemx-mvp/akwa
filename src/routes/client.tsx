import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell, type NavItem } from "@/components/AppShell";
import { auth } from "@/lib/auth";
import { LayoutDashboard, BookOpen, PlusCircle, ListOrdered, MessageSquare } from "lucide-react";

const nav: NavItem[] = [
  { to: "/client", label: "Dashboard", icon: LayoutDashboard },
  { to: "/client/catalog", label: "Catalog", icon: BookOpen },
  { to: "/client/new-order", label: "New Order", icon: PlusCircle, badge: "AI" },
  { to: "/client/orders", label: "My Orders", icon: ListOrdered },
  { to: "/client/ask", label: "Ask AKWA AI", icon: MessageSquare, badge: "AI" },
];

export const Route = createFileRoute("/client")({
  beforeLoad: () => {
    if (auth.role !== "client") {
      // allow admin to preview too
      if (auth.role !== "admin") throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell nav={nav} title="Client Portal">
      <Outlet />
    </AppShell>
  ),
});
