import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShoppingCart, Search, Clock, CheckCircle2, AlertTriangle, Euro, Eye, ArrowUpDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Kpi, Chip, orderStatusTone } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import {
  useBackoffice, boStore, eur, pct, dShort, goodsTotal, goodsCost, type OrderStatus,
} from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/commandes/")({
  head: () => ({
    meta: [
      { title: "Commandes — Back-office AKWA Export" },
      { name: "description", content: "Pilotage interne des commandes export AKWA : validation, marges réelles, priorités et délais de devis." },
      { property: "og:title", content: "Commandes — Back-office AKWA Export" },
      { property: "og:description", content: "Toutes les commandes clients avec analyse de marge interne et workflow de validation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

const STATUSES: OrderStatus[] = [
  "Commande reçue", "En attente d'informations", "Commande validée par AKWA",
  "Devis envoyé – En attente client", "Devis accepté", "Révision devis", "En préparation", "En transit", "Livrée", "Refusée",
];

function OrdersPage() {
  const { orders } = useBackoffice();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState<"date" | "amount" | "margin">("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const kpis = useMemo(() => {
    const ca = orders.reduce((s, o) => s + goodsTotal(o.items), 0);
    const cost = orders.reduce((s, o) => s + goodsCost(o.items), 0);
    return {
      total: orders.length,
      toValidate: orders.filter((o) => o.status === "Commande reçue" || o.status === "En attente d'informations").length,
      waiting: orders.filter((o) => o.status === "Devis envoyé – En attente client").length,
      accepted: orders.filter((o) => o.status === "Devis accepté").length,
      ca,
      margin: ca ? ((ca - cost) / ca) * 100 : 0,
    };
  }, [orders]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders
      .filter((o) => {
        const client = boStore.clientOf(o);
        return !t || o.reference.toLowerCase().includes(t) || client.name.toLowerCase().includes(t) || o.destination.toLowerCase().includes(t);
      })
      .filter((o) => status === "all" || o.status === status)
      .filter((o) => priority === "all" || o.priority === priority)
      .sort((a, b) => {
        const ma = goodsTotal(a.items) - goodsCost(a.items);
        const mb = goodsTotal(b.items) - goodsCost(b.items);
        const v = sort === "date" ? new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
          : sort === "amount" ? goodsTotal(a.items) - goodsTotal(b.items) : ma - mb;
        return dir === "asc" ? v : -v;
      });
  }, [orders, q, status, priority, sort, dir]);

  const toggle = (s: typeof sort) => { if (sort === s) setDir(dir === "asc" ? "desc" : "asc"); else { setSort(s); setDir("desc"); } };

  return (
    <div className="max-w-[1600px] space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commandes clients</h1>
        <p className="text-sm text-muted-foreground">Validation, analyse de marge interne et lancement de l'Agent Devis.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Commandes" value={kpis.total} icon={ShoppingCart} />
        <Kpi label="À traiter" value={kpis.toValidate} icon={Clock} tone="bg-warning/15 text-warning" />
        <Kpi label="Devis en attente client" value={kpis.waiting} icon={AlertTriangle} tone="bg-ai/15 text-ai" />
        <Kpi label="Devis acceptés" value={kpis.accepted} icon={CheckCircle2} tone="bg-success/15 text-success" />
        <Kpi label="Valeur marchandises" value={eur(kpis.ca)} icon={Euro} />
        <Kpi label="Marge marchandises" value={pct(kpis.margin)} icon={Sparkles} tone="bg-ai/15 text-ai" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une commande, un client…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous les statuts</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Priorité" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes priorités</SelectItem>{["Basse", "Normale", "Haute", "Critique"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Commande</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">
                  <button onClick={() => toggle("date")} className="inline-flex items-center gap-1 hover:text-foreground">Reçue le <ArrowUpDown className="h-3 w-3" /></button>
                </th>
                <th className="px-4 py-3 text-left font-medium">Destination</th>
                <th className="px-4 py-3 text-center font-medium">Articles</th>
                <th className="px-4 py-3 text-right font-medium">
                  <button onClick={() => toggle("amount")} className="inline-flex items-center gap-1 hover:text-foreground">Montant <ArrowUpDown className="h-3 w-3" /></button>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <button onClick={() => toggle("margin")} className="inline-flex items-center gap-1 hover:text-foreground">Marge interne <ArrowUpDown className="h-3 w-3" /></button>
                </th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Priorité</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => {
                const client = boStore.clientOf(o);
                const total = goodsTotal(o.items);
                const marginPct = total ? ((total - goodsCost(o.items)) / total) * 100 : 0;
                return (
                  <tr key={o.reference} className="transition-smooth hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {o.reference}
                      <div className="text-[11px] font-normal text-muted-foreground">{o.channel} · {o.incoterm}</div>
                    </td>
                    <td className="px-4 py-3">{client.name}<div className="text-[11px] text-muted-foreground">{client.country}</div></td>
                    <td className="px-4 py-3 text-muted-foreground">{dShort(o.receivedAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.destination}</td>
                    <td className="px-4 py-3 text-center">{o.items.length}</td>
                    <td className="px-4 py-3 text-right font-semibold">{eur(total)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-semibold", marginPct < 15 ? "text-destructive" : marginPct < 25 ? "text-warning" : "text-success")}>{pct(marginPct)}</span>
                      <div className="text-[11px] text-muted-foreground">{eur(total - goodsCost(o.items))}</div>
                    </td>
                    <td className="px-4 py-3"><Chip tone={orderStatusTone[o.status] ?? "muted"}>{o.status}</Chip></td>
                    <td className="px-4 py-3">
                      <Chip tone={o.priority === "Critique" ? "danger" : o.priority === "Haute" ? "warning" : "muted"}>{o.priority}</Chip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link to="/admin/commandes/$reference" params={{ reference: o.reference }}><Eye className="h-3.5 w-3.5" /> Ouvrir</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucune commande ne correspond à vos filtres.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
