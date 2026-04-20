import { createFileRoute } from "@tanstack/react-router";
import { agents } from "@/lib/agents";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your workspace and AI agents.</p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card p-5">
        <h3 className="font-semibold mb-4">Workspace</h3>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Organization</div>
              <div className="text-xs text-muted-foreground">AKWA Group — Export Division</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Default currency</div>
              <div className="text-xs text-muted-foreground">USD</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card p-5">
        <h3 className="font-semibold mb-4">AI Agents</h3>
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
