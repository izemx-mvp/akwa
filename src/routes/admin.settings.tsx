import { createFileRoute, Link } from "@tanstack/react-router";
import { agents } from "@/lib/agents";
import { Switch } from "@/components/ui/switch";
import { Users, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Configurez votre espace de travail et vos agents IA.</p>
      </div>

      <Link
        to="/admin/users"
        className="block rounded-xl border border-border bg-card shadow-card p-5 hover:border-primary transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary text-primary-foreground flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Utilisateurs & Accès</div>
            <div className="text-xs text-muted-foreground">
              Gérer les utilisateurs, rôles, permissions et la matrice des accès.
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>

      <div className="rounded-xl border border-border bg-card shadow-card p-5">
        <h3 className="font-semibold mb-4">Espace de travail</h3>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Organisation</div>
              <div className="text-xs text-muted-foreground">AKWA Group — Division Export</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Devise par défaut</div>
              <div className="text-xs text-muted-foreground">USD</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card p-5">
        <h3 className="font-semibold mb-4">Agents IA</h3>
        <div className="divide-y divide-border">
          {agents.map((a) => (
            <div key={a.id} className="py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-ai text-ai-foreground flex items-center justify-center"><a.icon className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.role}</div>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
