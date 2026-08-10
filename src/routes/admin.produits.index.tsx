import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Package, Search, Plus, Upload, CheckCircle2, XCircle, AlertTriangle, Layers, Factory, Percent, ArrowUpDown, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Kpi, Chip } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import {
  useBackoffice, boStore, eur2, pct, dShort, productMargin, productMarginPct, type Product,
} from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/produits/")({
  head: () => ({
    meta: [
      { title: "Produits — Back-office AKWA Export" },
      { name: "description", content: "Gestion du catalogue produits AKWA : prix d'achat, marges, logistique, fournisseurs et disponibilité." },
      { property: "og:title", content: "Produits — Back-office AKWA Export" },
      { property: "og:description", content: "Catalogue produits AKWA avec pilotage des marges, des fournisseurs et de la disponibilité." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductsPage,
});

const PAGE = 10;

function availTone(a: Product["availability"]) {
  return a === "Disponible" ? "success" : a === "Stock limité" ? "warning" : a === "Rupture" ? "danger" : "info";
}

function ProductsPage() {
  const { products, suppliers } = useBackoffice();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sup, setSup] = useState("all");
  const [avail, setAvail] = useState("all");
  const [margin, setMargin] = useState("all");
  const [origin, setOrigin] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"price" | "margin" | "updated">("updated");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string[]>([]);

  const cats = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);
  const origins = useMemo(() => Array.from(new Set(products.map((p) => p.origin))).sort(), [products]);

  const kpis = useMemo(() => ({
    total: 262 + products.length,
    active: products.filter((p) => p.status === "Actif").length + 230,
    inactive: products.filter((p) => p.status !== "Actif").length + 17,
    toCheck: products.filter((p) => p.priceToCheck).length + 11,
    cats: cats.length + 6,
    suppliers: suppliers.length + 27,
    avgMargin: products.reduce((s, p) => s + productMarginPct(p), 0) / (products.length || 1),
  }), [products, cats, suppliers]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products
      .filter((p) => !t || p.ref.toLowerCase().includes(t) || p.name.toLowerCase().includes(t) || p.brand.toLowerCase().includes(t))
      .filter((p) => cat === "all" || p.category === cat)
      .filter((p) => sup === "all" || p.suppliers.some((s) => s.primary && s.supplierId === sup))
      .filter((p) => avail === "all" || p.availability === avail)
      .filter((p) => origin === "all" || p.origin === origin)
      .filter((p) => status === "all" || p.status === status)
      .filter((p) => {
        const m = productMarginPct(p);
        return margin === "all" || (margin === "low" ? m < 25 : margin === "mid" ? m >= 25 && m < 32 : m >= 32);
      })
      .sort((a, b) => {
        const v = sort === "price" ? a.salePrice - b.salePrice
          : sort === "margin" ? productMarginPct(a) - productMarginPct(b)
          : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        return dir === "asc" ? v : -v;
      });
  }, [products, q, cat, sup, avail, origin, status, margin, sort, dir]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const toggleSort = (s: typeof sort) => { if (sort === s) setDir(dir === "asc" ? "desc" : "asc"); else { setSort(s); setDir("desc"); } };

  return (
    <div className="max-w-[1600px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogue produits</h1>
          <p className="text-sm text-muted-foreground">Pilotage commercial, logistique et fournisseur du catalogue export AKWA.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-1.5"><Link to="/admin/produits/import"><Upload className="h-4 w-4" /> Importer des produits</Link></Button>
          <Button asChild className="gap-1.5"><Link to="/admin/produits/nouveau"><Plus className="h-4 w-4" /> Ajouter un produit</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Produits" value={kpis.total} icon={Package} />
        <Kpi label="Actifs" value={kpis.active} icon={CheckCircle2} tone="bg-success/15 text-success" />
        <Kpi label="Indisponibles" value={kpis.inactive} icon={XCircle} tone="bg-destructive/15 text-destructive" />
        <Kpi label="Prix à vérifier" value={kpis.toCheck} icon={AlertTriangle} tone="bg-warning/15 text-warning" />
        <Kpi label="Catégories" value={kpis.cats} icon={Layers} />
        <Kpi label="Fournisseurs" value={kpis.suppliers} icon={Factory} />
        <Kpi label="Marge moyenne" value={pct(kpis.avgMargin)} icon={Percent} tone="bg-ai/15 text-ai" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Rechercher une référence, un produit…" className="pl-9" />
        </div>
        <Select value={cat} onValueChange={(v) => { setCat(v); setPage(0); }}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes catégories</SelectItem>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sup} onValueChange={setSup}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Fournisseur" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous fournisseurs</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={avail} onValueChange={setAvail}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Disponibilité" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes dispo.</SelectItem>
            {["Disponible", "Stock limité", "Rupture", "Sur commande"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={margin} onValueChange={setMargin}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Marge" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes marges</SelectItem>
            <SelectItem value="low">&lt; 25 %</SelectItem>
            <SelectItem value="mid">25 – 32 %</SelectItem>
            <SelectItem value="high">&gt; 32 %</SelectItem>
          </SelectContent>
        </Select>
        <Select value={origin} onValueChange={setOrigin}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Origine" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes origines</SelectItem>{origins.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {["Actif", "Inactif", "Brouillon"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {sel.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-2 text-sm">
          <span className="font-medium">{sel.length} produit(s) sélectionné(s)</span>
          <Button size="sm" variant="outline" onClick={() => { sel.forEach((r) => boStore.updateProduct(r, { priceToCheck: false }, "Prix confirmé")); setSel([]); }}>
            Marquer les prix comme vérifiés
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSel([])}>Annuler</Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3">
                  <Checkbox checked={view.length > 0 && view.every((p) => sel.includes(p.ref))}
                    onCheckedChange={(c) => setSel(c ? Array.from(new Set([...sel, ...view.map((p) => p.ref)])) : sel.filter((r) => !view.some((p) => p.ref === r)))} />
                </th>
                <th className="px-3 py-3 text-left font-medium">Produit</th>
                <th className="px-3 py-3 text-left font-medium">Catégorie</th>
                <th className="px-3 py-3 text-left font-medium">Fournisseur</th>
                <th className="px-3 py-3 text-left font-medium">Origine</th>
                <th className="px-3 py-3 text-right font-medium">
                  <button onClick={() => toggleSort("price")} className="inline-flex items-center gap-1 hover:text-foreground">Prix achat / vente <ArrowUpDown className="h-3 w-3" /></button>
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  <button onClick={() => toggleSort("margin")} className="inline-flex items-center gap-1 hover:text-foreground">Marge <ArrowUpDown className="h-3 w-3" /></button>
                </th>
                <th className="px-3 py-3 text-left font-medium">Disponibilité</th>
                <th className="px-3 py-3 text-left font-medium">
                  <button onClick={() => toggleSort("updated")} className="inline-flex items-center gap-1 hover:text-foreground">MAJ <ArrowUpDown className="h-3 w-3" /></button>
                </th>
                <th className="px-3 py-3 text-left font-medium">Statut</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {view.map((p) => {
                const primary = p.suppliers.find((s) => s.primary);
                const supName = boStore.getSupplier(primary?.supplierId ?? "")?.name ?? "—";
                return (
                  <tr key={p.ref} className="transition-smooth hover:bg-muted/30">
                    <td className="px-3 py-3">
                      <Checkbox checked={sel.includes(p.ref)} onCheckedChange={(c) => setSel(c ? [...sel, p.ref] : sel.filter((r) => r !== p.ref))} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-lg">{p.emoji}</span>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{p.ref} · {p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-3 py-3 text-muted-foreground">{supName}</td>
                    <td className="px-3 py-3 text-muted-foreground">{p.origin}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="font-semibold">{eur2(p.salePrice)}</div>
                      <div className="text-[11px] text-muted-foreground">achat {eur2(p.purchasePrice)}</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className={cn("font-semibold", productMarginPct(p) < 25 ? "text-warning" : "text-success")}>{pct(productMarginPct(p))}</div>
                      <div className="text-[11px] text-muted-foreground">{eur2(productMargin(p))}</div>
                    </td>
                    <td className="px-3 py-3"><Chip tone={availTone(p.availability)}>{p.availability}</Chip></td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {dShort(p.updatedAt)}
                      {p.priceToCheck && <div className="text-[10px] text-warning">Prix à vérifier</div>}
                    </td>
                    <td className="px-3 py-3"><Chip tone={p.status === "Actif" ? "success" : "muted"}>{p.status}</Chip></td>
                    <td className="px-3 py-3 text-right">
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link to="/admin/produits/$ref" params={{ ref: p.ref }}><Eye className="h-3.5 w-3.5" /> Ouvrir</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {view.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun produit ne correspond à vos filtres.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>{rows.length} produit(s) · page {page + 1} / {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</Button>
            <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Suivant</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
