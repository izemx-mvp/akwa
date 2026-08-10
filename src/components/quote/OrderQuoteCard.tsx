import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuotes, quotesStore, quoteTotal, statusStyle, eur, dateFR } from "@/lib/quotes-store";

export function OrderQuoteCard({ orderRef }: { orderRef: string }) {
  useQuotes();
  const quote = quotesStore.latestForOrder(orderRef);
  if (!quote) return null;
  const versions = quotesStore.versionsOf(quote.family);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              Devis {quote.id}
              <span className={cn("rounded px-2 py-0.5 text-[11px] font-medium", statusStyle[quote.status])}>{quote.status}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {eur(quoteTotal(quote))} · émis le {dateFR(quote.issuedAt)}
              {versions.length > 1 ? ` · ${versions.length} versions` : ""}
            </div>
          </div>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link to="/client/devis/$quoteId" params={{ quoteId: quote.id }}>Consulter le devis</Link>
        </Button>
      </div>
    </div>
  );
}
