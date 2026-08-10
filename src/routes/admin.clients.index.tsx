import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Search, Euro, TrendingUp, AlertTriangle, Eye, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Kpi, Chip } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { useBackoffice, eur, pct, dShort } from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/clients/")({
  head: () => ({
    meta: [
      { title: "Clients — Back-office AKWA Export" },
      { name: "description", content: "Portefeuille clients AKWA : chiffre d'affaires, marges, encours, risque de paiement et priorité commerciale." },
      { property: "og:title", content: "Clients — Back-office AKWA Export" },
      { property: "og:description", content: "Vue consolidée du portefeuille clients export avec indicateurs financiers et commerciaux." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { clients } = useBackoffice();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("all");
  const [priority, setPriority] = useState("all");
  const [risk, setRisk] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"ca" | "margin" | "balance">("ca");

  const countries = useMemo(() => Array.from(new Set(clients.map((c) => c.country))).sort(), [clients]);

  const kpis = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.status === "Actif").length,
    ca: clients.reduce((s, c) => s + c.revenueYear, 0),
    margin: clients.reduce((s, c) => s + c.margin, 0),
    balance: clients.reduce((s, c) => s + c.balance, 0),
    risky: clients.filter((c) => c.paymentRisk !== "Faible").length,
  }), [clients]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return clients
      .filter((c) => !t || c.name.toLowerCase().includes(t) || c.city.toLowerCase().includes(t) || c.contactMain.toLowerCase().includes(t))
      .filter((c) => country === "all" || c.country === country)
      .filter((c) => priority === "all" || c.priority === priority)
      .filter((c) => risk === "all" || c.paymentRisk === risk)
      .filter((c) => status === "all" || c.status === status)
      .sort((a, b) => (sort === "ca" ? b.revenueYear - a.revenueYear : sort === "margin" ? b.margin - a.margin : b.balance - a.balance));
  }, [clients, q, country, priority, risk, status, sort]);

  return (
    <div className="max-w-[1600px] space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portefeuille clients</h1>
        <p className="text-sm text-muted-foreground">Vue 360° commerciale, financière et logistique de chaque client export.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Clients" value={kpis.total} icon={Users} />
        <Kpi label="Clients actifs" value={kpis.active} icon={Star} tone="bg-success/15 text-success" />
        <Kpi label="CA année en cours" value={eur(kpis.ca)} icon={Euro} tone="bg-primary/10 text-primary" />
        <Kpi label="Marge générée" value={eur(kpis.margin)} icon={TrendingUp} tone="bg-ai/15 text-ai" />
        <Kpi label="Encours à recouvrer" value={eur(kpis.balance)} icon={Clock} tone="bg-warning/15 text-warning" />
        <Kpi label="Clients à risque" value={kpis.risky} icon={AlertTriangle} tone="bg-destructive/15 text-destructive" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client, une ville, un contact…" className="pl-9" />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Pays" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous pays</SelectItem>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priorité" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes priorités</SelectItem>{["Standard", "Important", "Stratégique", "VIP"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={risk} onValueChange={setRisk}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Risque" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous risques</SelectItem>{["Faible", "Modéré", "Élevé"].map((p) => <SelectItem key={p} value={p}>Risque {p.toLowerCase()}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous statuts</SelectItem>{["Actif", "Inactif", "Prospect"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ca">Trier par CA</SelectItem>
            <SelectItem value="margin">Trier par marge</SelectItem>
            <SelectItem value="balance">Trier par encours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Pays / ville</th>
                <th className="px-4 py-3 text-right font-medium">CA total</th>
                <th className="px-4 py-3 text-right font-medium">CA année</th>
                <th className="px-4 py-3 text-right font-medium">Marge</th>
                <th className="px-4 py-3 text-center font-medium">Commandes</th>
                <th className="px-4 py-3 text-right font-medium">Encours</th>
                <th className="px-4 py-3 text-center font-medium">Taux acceptation</th>
                <th className="px-4 py-3 text-left font-medium">Risque</th>
                <th className="px-4 py-3 text-left font-medium">Dernière commande</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id} className="transition-smooth hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      {c.priority !== "Standard" && <Chip tone={c.priority === "VIP" ? "ai" : "info"}>{c.priority}</Chip>}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{c.contactMain} · client depuis {new Date(c.since).getFullYear()}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.country}<div className="text-[11px]">{c.city}</div></td>
                  <td className="px-4 py-3 text-right font-medium">{eur(c.revenueTotal)}</td>
                  <td className="px-4 py-3 text-right">{eur(c.revenueYear)}</td>
                  <td className="px-4 py-3 text-right text-success">{eur(c.margin)}</td>
                  <td className="px-4 py-3 text-center">{c.ordersCount}<div className="text-[11px] text-muted-foreground">{c.activeOrders} en cours</div></td>
                  <td className={cn("px-4 py-3 text-right font-medium", c.balance > 0 ? "text-warning" : "text-muted-foreground")}>{eur(c.balance)}</td>
                  <td className="px-4 py-3 text-center">{pct(c.quoteAcceptRate)}</td>
                  <td className="px-4 py-3">
                    <Chip tone={c.paymentRisk === "Faible" ? "success" : c.paymentRisk === "Modéré" ? "warning" : "danger"}>{c.paymentRisk}</Chip>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{c.avgPaymentDelay} j de délai moyen</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{dShort(c.lastOrder)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <Link to="/admin/clients/$clientId" params={{ clientId: c.id }}><Eye className="h-3.5 w-3.5" /> Fiche 360°</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun client ne correspond à vos filtres.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
