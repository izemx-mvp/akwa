import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { quotesStore, useQuoteNotifications, dateTimeFR } from "@/lib/quotes-store";

export function QuoteNotifications() {
  const notifications = useQuoteNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover onOpenChange={(o) => { if (o && unread) setTimeout(() => quotesStore.markNotificationsRead(), 1200); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications devis">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">Notifications</div>
        <div className="max-h-80 divide-y divide-border overflow-y-auto">
          {notifications.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Aucune notification.</p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className={cn("p-3", !n.read && "bg-primary/5")}>
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  n.tone === "warning" && "text-warning",
                  n.tone === "success" && "text-success",
                )}>{n.title}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{dateTimeFR(n.at)}</span>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <Link to="/client/devis/$quoteId" params={{ quoteId: n.quoteId }}>Consulter</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
