import { createFileRoute } from "@tanstack/react-router";
import { Bell, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Panel, Chip } from "@/components/admin/ui";
import { useBackoffice, boStore, dTime } from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications & activité — Back-office AKWA" },
      { name: "description", content: "Fil d'activité interne AKWA : validations de commandes, devis envoyés, réponses clients et alertes de marge." },
      { property: "og:title", content: "Notifications & activité — Back-office AKWA" },
      { property: "og:description", content: "Toutes les alertes et actions internes de la plateforme export AKWA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, activities } = useBackoffice();

  return (
    <div className="max-w-[1200px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications & activité</h1>
          <p className="text-sm text-muted-foreground">Alertes internes et journal complet des actions de l'équipe AKWA.</p>
        </div>
        <Button variant="outline" onClick={() => boStore.markNotificationsRead()}>Tout marquer comme lu</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Notifications">
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div key={n.id} className={cn("py-3", !n.read && "bg-primary/5")}>
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{n.title}</span>
                  <Chip tone={n.tone === "danger" ? "danger" : n.tone === "warning" ? "warning" : n.tone === "success" ? "success" : "info"}>{n.tone}</Chip>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{dTime(n.at)}</span>
                  {n.link && <Button asChild size="sm" variant="outline" className="h-7 text-xs"><a href={n.link}>Ouvrir</a></Button>}
                </div>
              </div>
            ))}
            {notifications.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucune notification.</p>}
          </div>
        </Panel>

        <Panel title="Journal d'activité">
          <ol className="space-y-3">
            {activities.slice(0, 40).map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted"><Activity className="h-3 w-3" /></span>
                <div>
                  <div className="text-sm"><span className="font-medium">{a.action}</span> — {a.object}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {dTime(a.at)} · {a.user}{a.from || a.to ? ` · ${a.from ?? "—"} → ${a.to ?? "—"}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
