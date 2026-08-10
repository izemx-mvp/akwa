import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Search, Clock, CheckCircle2, XCircle, Euro, Percent, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Kpi, Chip, quoteStatusTone } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { useBackoffice, boStore, eur, pct, dShort, quoteTotalTTC, quoteMargin, quoteMarginPct, MARGIN_THRESHOLD } from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/devis/")({
  head: () => ({
    meta: [
      { title: "Devis — Back-office AKWA Export" },
      { name: "description", content: "Tous les devis export AKWA : brouillons, envois, acceptations, refus et marges réelles par devis." },
      { property: "og:title", content: "Devis — Back-office AKWA Export" },
      { property: "og:description", content: "Suivi complet des devis émis avec marge interne, versions et statut client." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminQuotesPage,
});

function AdminQuotesPage() {
  const { adminQuotes, orders } = useBackoffice();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const kpis = useMemo(() => {
    const total = adminQuotes.reduce((s, x) => s + quoteTotalTTC(x), 0);
    const margin = adminQuotes.reduce((s, x) => s + quoteMargin(x), 0);
    return {
      total: adminQuotes.length,
      pending: adminQuotes.filter((x) => x.status === "À valider client" || x.status === "Envoyé").length,
      accepted: adminQuotes.filter((x) => x.status === "Accepté").length,
      refused: adminQuotes.filter((x) => x.status === "Refusé").length,
      amount: total,
      marginPct: total ? (margin / total) * 100 : 0,
    };
  }, [adminQuotes]);

  const toQuote = orders.filter((o) => o.status === "Commande validée par AKWA" || o.status === "Révision devis");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return adminQuotes
      .filter((x) => !t || x.id.toLowerCase().includes(t) || x.orderRef.toLowerCase().includes(t))
      .filter((x) => status === "all" || x.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [adminQuotes, q, status]);

  return (
    <div className="max-w-[1600px] space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Devis export</h1>
        <p className="text-sm text-muted-foreground">Génération, envoi, suivi des réponses clients et contrôle des marges réelles.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Devis" value={kpis.total} icon={FileText} />
        <Kpi label="En attente client" value={kpis.pending} icon={Clock} tone="bg-warning/15 text-warning" />
        <Kpi label="Acceptés" value={kpis.accepted} icon={CheckCircle2} tone="bg-success/15 text-success" />
        <Kpi label="Refusés" value={kpis.refused} icon={XCircle} tone="bg-destructive/15 text-destructive" />
        <Kpi label="Montant total" value={eur(kpis.amount)} icon={Euro} />
        <Kpi label="Marge moyenne" value={pct(kpis.marginPct)} icon={Percent} tone="bg-ai/15 text-ai" />
      </div>

      {toQuote.length > 0 && (
        <section className="rounded-xl border border-ai/40 bg-ai/5 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ai" />
            <h2 className="text-sm font-semibold">Commandes prêtes pour l'Agent Devis</h2>
            <Chip tone="ai">{toQuote.length}</Chip>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {toQuote.map((o) => (
              <div key={o.reference} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{o.reference}</div>
                  <div className="text-[11px] text-muted-foreground">{boStore.clientOf(o).name} · {o.destination}</div>
                </div>
                <Button asChild size="sm" className="gap-1.5">
                  <Link to="/admin/devis/generer/$reference" params={{ reference: o.reference }}><Sparkles className="h-3.5 w-3.5" /> Générer</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un devis, une commande…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {["Brouillon", "Validé", "À valider client", "Accepté", "Refusé", "Expiré", "Remplacé"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Devis</th>
                <th className="px-4 py-3 text-left font-medium">Commande</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Créé le</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
                <th className="px-4 py-3 text-right font-medium">Marge réelle</th>
                <th className="px-4 py-3 text-left font-medium">Validité</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((x) => {
                const client = boStore.getClient(x.clientId);
                const mp = quoteMarginPct(x);
                return (
                  <tr key={x.id} className="transition-smooth hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{x.id}<div className="text-[11px] font-normal text-muted-foreground">Version {x.version}</div></td>
                    <td className="px-4 py-3 text-muted-foreground">{x.orderRef}</td>
                    <td className="px-4 py-3">{client?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dShort(x.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{eur(quoteTotalTTC(x))}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold", mp < MARGIN_THRESHOLD ? "text-destructive" : "text-success")}>
                      {pct(mp)}<div className="text-[11px] font-normal text-muted-foreground">{eur(quoteMargin(x))}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{dShort(x.validUntil)}</td>
                    <td className="px-4 py-3"><Chip tone={quoteStatusTone[x.status] ?? "muted"}>{x.status}</Chip></td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link to="/admin/devis/$quoteId" params={{ quoteId: x.id }}><Eye className="h-3.5 w-3.5" /> Ouvrir</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun devis pour ces critères.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
