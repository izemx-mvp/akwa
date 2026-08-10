import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Panel, Crumbs, Chip } from "@/components/admin/ui";
import { boStore, eur2 } from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/produits/import")({
  head: () => ({
    meta: [
      { title: "Import produits — Back-office AKWA" },
      { name: "description", content: "Importez en masse vos produits export AKWA depuis un fichier CSV avec prévisualisation et contrôle des erreurs." },
      { property: "og:title", content: "Import produits — Back-office AKWA" },
      { property: "og:description", content: "Import CSV des produits avec mapping, prévisualisation et rapport d'import." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportPage,
});

const SAMPLE = `reference;nom;categorie;prix_achat;prix_vente
AKW-IMP-101;Confiture de figues 320 g;Épicerie fine;2,10;3,45
AKW-IMP-102;Amlou artisanal 250 g;Épicerie fine;4,80;7,20
AKW-IMP-103;Olives Picholine 5 kg;Conserves;9,40;13,90
AKW-IMP-104;Safran pur 2 g;Épices;6,20;11,50`;

type Row = { ref: string; name: string; category: string; buy: number; sell: number; error?: string };

function parse(text: string): Row[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).slice(1).map((line) => {
    const [ref, name, category, buy, sell] = line.split(/[;,\t]/).map((c) => (c ?? "").trim());
    const b = Number((buy ?? "").replace(",", "."));
    const s = Number((sell ?? "").replace(",", "."));
    let error: string | undefined;
    if (!ref) error = "Référence manquante";
    else if (!name) error = "Nom manquant";
    else if (!Number.isFinite(b) || !Number.isFinite(s)) error = "Prix invalide";
    else if (s <= b) error = "Prix de vente inférieur au prix d'achat";
    return { ref, name, category: category || "Divers", buy: b, sell: s, error };
  });
}

function ImportPage() {
  const [raw, setRaw] = useState(SAMPLE);
  const [mode, setMode] = useState<"create" | "update" | "both">("both");
  const [report, setReport] = useState<{ created: number; updated: number; ignored: number } | null>(null);
  const rows = useMemo(() => parse(raw), [raw]);
  const valid = rows.filter((r) => !r.error);
  const invalid = rows.filter((r) => r.error);

  const run = () => {
    const res = boStore.importProducts(valid.map(({ ref, name, category, buy, sell }) => ({ ref, name, category, buy, sell })), mode);
    setReport({ created: res.created, updated: res.updated, ignored: invalid.length });
    toast.success("Import terminé", { description: `${res.created} créés, ${res.updated} mis à jour, ${invalid.length} ignorés.` });
  };

  return (
    <div className="max-w-5xl space-y-5">
      <Crumbs items={[{ label: "Back-office", to: "/admin" }, { label: "Produits", to: "/admin/produits" }, { label: "Import" }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importer des produits</h1>
          <p className="text-sm text-muted-foreground">Collez ou déposez un fichier CSV, vérifiez la prévisualisation puis lancez l'import.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setRaw(SAMPLE)}><Download className="h-4 w-4" /> Modèle CSV</Button>
          <Button variant="outline" asChild className="gap-1.5"><Link to="/admin/produits"><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>
        </div>
      </div>

      <Panel title="Fichier source" description="Colonnes attendues : reference ; nom ; categorie ; prix_achat ; prix_vente">
        <div className="grid gap-4 md:grid-cols-[1fr_240px]">
          <div className="space-y-1.5">
            <Label>Contenu CSV</Label>
            <Textarea rows={8} value={raw} onChange={(e) => { setRaw(e.target.value); setReport(null); }} className="font-mono text-xs" />
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Mode d'import</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Créer et mettre à jour</SelectItem>
                  <SelectItem value="create">Créer uniquement</SelectItem>
                  <SelectItem value="update">Mettre à jour uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground hover:border-primary/50">
              <FileSpreadsheet className="h-5 w-5" />
              Déposer un fichier .csv
              <input type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) file.text().then((t) => { setRaw(t); setReport(null); }); }} />
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <Chip tone="success">{valid.length} lignes valides</Chip>
              {invalid.length > 0 && <Chip tone="danger">{invalid.length} en erreur</Chip>}
            </div>
            <Button className="w-full gap-1.5" disabled={valid.length === 0} onClick={run}><Upload className="h-4 w-4" /> Lancer l'import</Button>
          </div>
        </div>
      </Panel>

      <Panel title="Prévisualisation">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Référence</th>
                <th className="px-3 py-2 text-left font-medium">Produit</th>
                <th className="px-3 py-2 text-left font-medium">Catégorie</th>
                <th className="px-3 py-2 text-right font-medium">Achat</th>
                <th className="px-3 py-2 text-right font-medium">Vente</th>
                <th className="px-3 py-2 text-left font-medium">Contrôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr key={i} className={cn(r.error && "bg-destructive/5")}>
                  <td className="px-3 py-2 font-mono text-xs">{r.ref || "—"}</td>
                  <td className="px-3 py-2">{r.name || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.category}</td>
                  <td className="px-3 py-2 text-right">{Number.isFinite(r.buy) ? eur2(r.buy) : "—"}</td>
                  <td className="px-3 py-2 text-right">{Number.isFinite(r.sell) ? eur2(r.sell) : "—"}</td>
                  <td className="px-3 py-2">
                    {r.error
                      ? <span className="inline-flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> {r.error}</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Prêt</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {report && (
        <Panel title="Rapport d'import">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-success/40 bg-success/5 p-3"><div className="text-2xl font-bold text-success">{report.created}</div><div className="text-xs text-muted-foreground">Produits créés</div></div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3"><div className="text-2xl font-bold text-primary">{report.updated}</div><div className="text-xs text-muted-foreground">Produits mis à jour</div></div>
            <div className="rounded-lg border border-border p-3"><div className="text-2xl font-bold">{report.ignored}</div><div className="text-xs text-muted-foreground">Lignes ignorées</div></div>
          </div>
        </Panel>
      )}
    </div>
  );
}
