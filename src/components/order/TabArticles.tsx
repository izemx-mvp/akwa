import { useMemo, useState } from "react";
import { Search, ArrowUpDown, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard, Chip, EmptyState } from "./shared";
import { eur, eur2, num, type ExportOrder, type PrepStatus } from "@/lib/export-order-store";

const prepTone: Record<PrepStatus, "success" | "warning" | "danger"> = {
  "Prêt": "success",
  "En préparation": "warning",
  "Attente fournisseur": "danger",
};

const PAGE = 6;

export function TabArticles({ order }: { order: ExportOrder }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"none" | "qty" | "amount">("none");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    let r = order.lines.filter(
      (l) =>
        (status === "all" || l.prep === status) &&
        (l.name.toLowerCase().includes(q.toLowerCase()) || l.ref.toLowerCase().includes(q.toLowerCase())),
    );
    if (sort === "qty") r = [...r].sort((a, b) => (a.qty - b.qty) * dir);
    if (sort === "amount") r = [...r].sort((a, b) => (a.qty * a.unitPrice - b.qty * b.unitPrice) * dir);
    return r;
  }, [order.lines, q, status, sort, dir]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = rows.slice(current * PAGE, current * PAGE + PAGE);

  const toggleSort = (s: "qty" | "amount") => {
    if (sort === s) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(s);
      setDir(-1);
    }
    setPage(0);
  };

  const t = order.totals;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Articles commandés"
        subtitle={`${order.lines.length} références • ${num(order.lines.reduce((s, l) => s + l.qty, 0))} unités`}
        icon={ListChecks}
        dense
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                placeholder="Rechercher un produit…"
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Prêt">Prêt</SelectItem>
                <SelectItem value="En préparation">En préparation</SelectItem>
                <SelectItem value="Attente fournisseur">Attente fournisseur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        {shown.length === 0 ? (
          <EmptyState icon={Search} title="Aucun article ne correspond" hint="Modifiez votre recherche ou vos filtres." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Référence</th>
                  <th className="px-4 py-2.5 text-left font-medium">Produit</th>
                  <th className="px-4 py-2.5 text-left font-medium">Catégorie</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("qty")}>
                      Quantité <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium">Unité</th>
                  <th className="px-4 py-2.5 text-right font-medium">Prix unitaire</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("amount")}>
                      Montant <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">Poids</th>
                  <th className="px-4 py-2.5 text-left font-medium">Préparation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((l) => (
                  <tr key={l.ref} className="transition-smooth hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs">{l.ref}</td>
                    <td className="px-4 py-2.5 font-medium">{l.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{l.category}</td>
                    <td className="px-4 py-2.5 text-right">{num(l.qty)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{l.unit}</td>
                    <td className="px-4 py-2.5 text-right">{eur2(l.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{eur(l.qty * l.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{num(l.weightKg)} kg</td>
                    <td className="px-4 py-2.5"><Chip tone={prepTone[l.prep]}>{l.prep}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>{rows.length} référence(s) — page {current + 1} / {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={current === 0} onClick={() => setPage(current - 1)}>Précédent</Button>
            <Button size="sm" variant="outline" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Suivant</Button>
          </div>
        </div>
      </SectionCard>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="mb-3 text-sm font-semibold">Récapitulatif financier</h3>
        <dl className="ml-auto max-w-sm space-y-1.5 text-sm">
          {([
            ["Sous-total marchandises", t.goods],
            ["Frais logistiques", t.logistics],
            ["Assurance", t.insurance],
            ["Fret maritime", t.freight],
            ["Autres frais", t.other],
          ] as [string, number][]).map(([l, v]) => (
            <div key={l} className="flex justify-between">
              <dt className="text-muted-foreground">{l}</dt>
              <dd>{eur(v)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total commande</dt>
            <dd className="text-primary">{eur(t.total)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
