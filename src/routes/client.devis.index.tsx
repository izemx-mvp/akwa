import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText, Search, Clock, CheckCircle2, XCircle, AlertTriangle, ArrowUpDown, Eye, MapPin, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useQuotes, quoteTotal, statusStyle, dateShort, dateFR, eur, daysLeft, isActionable,
  type Quote, type QuoteStatus,
} from "@/lib/quotes-store";

export const Route = createFileRoute("/client/devis/")({
  head: () => ({
    meta: [
      { title: "Mes devis — Portail client AKWA" },
      { name: "description", content: "Consultez, validez et suivez les devis export transmis par AKWA pour vos commandes." },
      { property: "og:title", content: "Mes devis — Portail client AKWA" },
      { property: "og:description", content: "Espace de validation des devis export AKWA : acceptation signée, refus motivé, versions et historique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuotesPage,
});

const STATUSES: QuoteStatus[] = [
  "Brouillon", "Envoyé", "À valider", "Accepté", "Refusé", "En révision", "Remplacé", "Expiré",
];

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof FileText; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", tone)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ValidityChip({ q }: { q: Quote }) {
  if (q.status === "Expiré") return <span className="text-xs text-muted-foreground">Expiré le {dateShort(q.validUntil)}</span>;
  const d = daysLeft(q);
  if (!isActionable(q)) return <span className="text-xs text-muted-foreground">{dateShort(q.validUntil)}</span>;
  return (
    <span className="text-xs">
      {dateShort(q.validUntil)}{" "}
      <span className={cn("font-medium", d <= 2 ? "text-destructive" : d <= 4 ? "text-warning" : "text-muted-foreground")}>
        · {d <= 0 ? "échu" : d === 1 ? "1 jour restant" : `${d} jours restants`}
      </span>
    </span>
  );
}

function QuotesPage() {
  const quotes = useQuotes();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [order, setOrder] = useState("all");
  const [sort, setSort] = useState<"date" | "amount">("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const kpis = useMemo(() => ({
    total: quotes.length,
    toValidate: quotes.filter(isActionable).length,
    accepted: quotes.filter((x) => x.status === "Accepté").length,
    refused: quotes.filter((x) => x.status === "Refusé").length,
    expired: quotes.filter((x) => x.status === "Expiré").length,
  }), [quotes]);

  const orderRefs = useMemo(() => Array.from(new Set(quotes.map((x) => x.orderRef))).sort(), [quotes]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const now = Date.now();
    const periodDays = period === "30" ? 30 : period === "90" ? 90 : period === "180" ? 180 : null;
    return quotes
      .filter((x) => !term || x.id.toLowerCase().includes(term) || x.orderRef.toLowerCase().includes(term) || x.client.toLowerCase().includes(term))
      .filter((x) => status === "all" || x.status === status)
      .filter((x) => order === "all" || x.orderRef === order)
      .filter((x) => !periodDays || now - new Date(x.issuedAt).getTime() <= periodDays * 86_400_000)
      .sort((a, b) => {
        const v = sort === "date"
          ? new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime()
          : quoteTotal(a) - quoteTotal(b);
        return dir === "asc" ? v : -v;
      });
  }, [quotes, q, status, period, order, sort, dir]);

  const actionable = quotes.filter(isActionable).sort((a, b) => daysLeft(a) - daysLeft(b));

  const toggleSort = (s: "date" | "amount") => {
    if (sort === s) setDir(dir === "asc" ? "desc" : "asc");
    else { setSort(s); setDir("desc"); }
  };

  return (
    <div className="max-w-[1500px] space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes devis</h1>
        <p className="text-sm text-muted-foreground">
          Consultez, validez et suivez les devis transmis par AKWA pour vos commandes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Total des devis" value={kpis.total} icon={FileText} tone="bg-primary/10 text-primary" />
        <Kpi label="À valider" value={kpis.toValidate} icon={Clock} tone="bg-warning/15 text-warning" />
        <Kpi label="Acceptés" value={kpis.accepted} icon={CheckCircle2} tone="bg-success/15 text-success" />
        <Kpi label="Refusés" value={kpis.refused} icon={XCircle} tone="bg-destructive/15 text-destructive" />
        <Kpi label="Expirés" value={kpis.expired} icon={AlertTriangle} tone="bg-muted text-muted-foreground" />
      </div>

      {actionable.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-warning/15 text-warning">
              <Clock className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold">Devis nécessitant votre validation</h2>
            <span className="rounded-md bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
              {actionable.length} en attente
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {actionable.map((x) => {
              const d = daysLeft(x);
              return (
                <div key={x.id} className="rounded-xl border border-warning/40 bg-warning/5 p-4 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{x.id}</span>
                        <span className={cn("rounded px-2 py-0.5 text-[11px] font-medium", statusStyle[x.status])}>À valider</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Commande <span className="font-medium text-foreground">{x.orderRef}</span> · {x.client}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {x.destination}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{eur(quoteTotal(x))}</div>
                      <div className="text-[11px] text-muted-foreground">Émis le {dateFR(x.issuedAt)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-warning/25 pt-3">
                    <div className="text-xs">
                      Valable jusqu'au <span className="font-medium">{dateFR(x.validUntil)}</span>{" "}
                      <span className={cn("font-semibold", d <= 2 ? "text-destructive" : "text-warning")}>
                        · {d <= 0 ? "expire aujourd'hui" : d <= 2 ? `expire dans ${d} jour${d > 1 ? "s" : ""}` : `${d} jours restants`}
                      </span>
                    </div>
                    <Button asChild size="sm" className="gap-1.5">
                      <Link to="/client/devis/$quoteId" params={{ quoteId: x.id }}>
                        Consulter et valider <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un devis, une commande…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Période" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes périodes</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
            <SelectItem value="180">6 derniers mois</SelectItem>
          </SelectContent>
        </Select>
        <Select value={order} onValueChange={setOrder}>
          <SelectTrigger className="w-[210px]"><SelectValue placeholder="Commande" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les commandes</SelectItem>
            {orderRefs.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Référence devis</th>
                <th className="px-4 py-3 text-left font-medium">Commande associée</th>
                <th className="px-4 py-3 text-left font-medium">
                  <button onClick={() => toggleSort("date")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Date d'émission <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <button onClick={() => toggleSort("amount")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Montant <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">Devise</th>
                <th className="px-4 py-3 text-left font-medium">Validité</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Dernière MAJ</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((x) => {
                const last = x.timeline[x.timeline.length - 1];
                return (
                  <tr key={x.id} className="transition-smooth hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {x.id}
                      <div className="text-[11px] font-normal text-muted-foreground">{x.client}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{x.orderRef}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dateShort(x.issuedAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{eur(quoteTotal(x))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{x.currency}</td>
                    <td className="px-4 py-3"><ValidityChip q={x} /></td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded px-2 py-0.5 text-[11px] font-medium", statusStyle[x.status])}>{x.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{last ? dateShort(last.at) : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant={isActionable(x) ? "default" : "outline"} className="gap-1.5">
                        <Link to="/client/devis/$quoteId" params={{ quoteId: x.id }}>
                          <Eye className="h-3.5 w-3.5" /> {isActionable(x) ? "Consulter et répondre" : "Voir le devis"}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Aucun devis ne correspond à vos filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Un devis apparaît ici uniquement après validation de votre commande par AKWA et envoi officiel du devis.
      </p>
    </div>
  );
}
