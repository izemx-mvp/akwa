import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { boStore, useBackoffice, dTime } from "@/lib/backoffice-store";

export function AdminNotifications() {
  const { notifications } = useBackoffice();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover onOpenChange={(o) => { if (o && unread) setTimeout(() => boStore.markNotificationsRead(), 1500); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications AKWA">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-sm font-semibold">Notifications AKWA</span>
          <Link to="/admin/notifications" className="text-xs text-primary hover:underline">Tout voir</Link>
        </div>
        <div className="max-h-96 divide-y divide-border overflow-y-auto">
          {notifications.slice(0, 12).map((n) => (
            <div key={n.id} className={cn("p-3", !n.read && "bg-primary/5")}>
              <div className={cn(
                "text-sm font-medium",
                n.tone === "warning" && "text-warning",
                n.tone === "danger" && "text-destructive",
                n.tone === "success" && "text-success",
              )}>{n.title}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{dTime(n.at)}</span>
                {n.link && (
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link to={n.link}>Ouvrir</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
