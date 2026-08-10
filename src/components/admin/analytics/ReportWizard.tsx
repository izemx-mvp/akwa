import { useState } from "react";
import { toast } from "sonner";
import { FileText, Table2, Printer, Save, Share2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  analyticsStore, executiveSummary, eurCompact, pct1, num, byCountry, byClient, byProduct,
  type Dataset, type ReportKind,
} from "@/lib/analytics-store";

const KINDS: ReportKind[] = [
  "Rapport exécutif", "Rapport commercial", "Rapport rentabilité", "Rapport clients",
  "Rapport produits & pricing", "Rapport export & logistique", "Rapport facturation & cash", "Rapport personnalisé",
];

const SECTIONS = [
  "KPI clés", "Graphiques", "Top clients", "Top produits", "Alertes", "Insights",
  "Comparaison période précédente", "Waterfall de rentabilité", "Aging des créances", "Commentaires",
];

export function ReportWizard({ open, onOpenChange, data }: { open: boolean; onOpenChange: (v: boolean) => void; data: Dataset }) {
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<ReportKind>("Rapport exécutif");
  const [name, setName] = useState(`Synthèse exécutive — ${data.range.label}`);
  const [sections, setSections] = useState<string[]>(["KPI clés", "Graphiques", "Top clients", "Alertes", "Insights", "Comparaison période précédente"]);
  const [comment, setComment] = useState("");

  const summary = executiveSummary(data);
  const topCountries = byCountry(data.sales).slice(0, 5);
  const topClients = byClient(data.sales).slice(0, 5);
  const topProducts = byProduct(data.sales).slice(0, 5);

  const toggle = (s: string) => setSections((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));

  const finish = (format: "PDF" | "Excel") => {
    analyticsStore.saveReport({ name, kind, period: data.range.label, format, filters: data.filters, sections, comment, summary });
    toast.success(`${format} généré — rapport enregistré dans Pilotage › Rapports`);
    onOpenChange(false);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setStep(1); }}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Générer un rapport</DialogTitle>
          <DialogDescription>
            Étape {step} / 3 — {step === 1 ? "type de rapport" : step === 2 ? "configuration" : "aperçu avant génération"} · période {data.range.label}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setKind(k); setName(`${k} — ${data.range.label}`); }}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-smooth hover:border-primary",
                  kind === k ? "border-primary bg-primary/5 font-semibold" : "border-border",
                )}
              >
                {k}
                {kind === k && <Check className="ml-2 inline h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium">Nom du rapport</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </label>
            <div>
              <span className="text-xs font-medium">Contenu à inclure</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SECTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
                    <Checkbox checked={sections.includes(s)} onCheckedChange={() => toggle(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <div className="font-semibold">Filtres appliqués</div>
              <p className="mt-1 text-muted-foreground">
                Période {data.range.label} · Comparaison {data.cmp?.label ?? "aucune"} ·{" "}
                {data.filters.clientId !== "Tous" ? data.filters.clientId : "tous clients"} ·{" "}
                {data.filters.country !== "Tous" ? data.filters.country : "tous pays"} ·{" "}
                {data.filters.category !== "Tous" ? data.filters.category : "toutes catégories"}
              </p>
            </div>
            <label className="block">
              <span className="text-xs font-medium">Commentaires de la direction</span>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1" placeholder="Contexte, décisions, arbitrages…" />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-xl border border-border bg-background p-5 text-sm">
            <div className="border-b border-border pb-4 text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">AKWA Export — Lubrifiants & fluides automobiles</div>
              <h3 className="mt-1 text-xl font-bold">{name}</h3>
              <p className="text-xs text-muted-foreground">{kind} · {data.range.label} · généré le {new Date().toLocaleDateString("fr-FR")}</p>
            </div>

            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Synthèse exécutive</h4>
              <p className="whitespace-pre-line text-xs leading-relaxed">{summary}</p>
            </div>

            {sections.includes("KPI clés") && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">KPI clés</h4>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  {[
                    ["Chiffre d'affaires", eurCompact(data.cur.revenue)],
                    ["Marge brute", eurCompact(data.cur.margin)],
                    ["Taux de marge", pct1(data.cur.marginPct)],
                    ["Commandes", num(data.cur.orders)],
                    ["Panier moyen", eurCompact(data.cur.avgBasket)],
                    ["Encaissements", eurCompact(data.cash.collected)],
                    ["À recevoir", eurCompact(data.cash.outstanding)],
                    ["Remplissage moyen", pct1(data.cont.avgFill)],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded border border-border p-2">
                      <div className="text-[10px] text-muted-foreground">{l}</div>
                      <div className="font-semibold">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sections.includes("Top clients") && (
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top clients</h4>
                <ul className="space-y-0.5 text-xs">
                  {topClients.map((c) => <li key={c.key}>• {c.label} — {eurCompact(c.revenue)} · marge {pct1(c.marginPct)}</li>)}
                </ul>
              </div>
            )}

            {sections.includes("Top produits") && (
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top produits</h4>
                <ul className="space-y-0.5 text-xs">
                  {topProducts.map((p) => <li key={p.key}>• {p.label} — {eurCompact(p.revenue)} · {num(p.litres)} L</li>)}
                </ul>
              </div>
            )}

            {sections.includes("Graphiques") && (
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marchés</h4>
                <ul className="space-y-0.5 text-xs">
                  {topCountries.map((c) => <li key={c.key}>• {c.label} — {eurCompact(c.revenue)} · marge {pct1(c.marginPct)} · {num(c.orders)} commandes</li>)}
                </ul>
              </div>
            )}

            {sections.includes("Alertes") && (
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Points d'attention</h4>
                <ul className="space-y-0.5 text-xs">
                  {data.alerts.slice(0, 6).map((a) => <li key={a.id}>• {a.title} — {a.detail}</li>)}
                </ul>
              </div>
            )}

            {sections.includes("Insights") && (
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommandations</h4>
                <ul className="space-y-0.5 text-xs">
                  <li>• Sécuriser les encaissements en retard ({eurCompact(data.cash.late)}) avant la fin du mois.</li>
                  <li>• Renégocier le fret sur les destinations à faible rentabilité logistique.</li>
                  <li>• Réviser les prix de vente des références ayant subi une hausse fournisseur.</li>
                </ul>
              </div>
            )}

            {comment && (
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commentaires</h4>
                <p className="text-xs">{comment}</p>
              </div>
            )}

            <p className="border-t border-border pt-3 text-[10px] text-muted-foreground">
              Annexes : détail des {num(data.cur.orders)} commandes, {num(data.invoices.length)} factures et {num(data.payments.length)} paiements de la période.
            </p>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {step > 1 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Retour</Button>}
          {step < 3 && <Button onClick={() => setStep((s) => s + 1)}>Continuer</Button>}
          {step === 3 && (
            <>
              <Button variant="ghost" onClick={() => { window.print(); }}><Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimer</Button>
              <Button variant="outline" onClick={() => toast.success("Rapport partagé avec la direction AKWA")}><Share2 className="mr-1.5 h-3.5 w-3.5" /> Partager</Button>
              <Button variant="outline" onClick={() => finish("Excel")}><Table2 className="mr-1.5 h-3.5 w-3.5" /> Excel</Button>
              <Button variant="secondary" onClick={() => { analyticsStore.saveReport({ name, kind, period: data.range.label, format: "PDF", filters: data.filters, sections, comment, summary }); toast.success("Rapport enregistré"); onOpenChange(false); setStep(1); }}>
                <Save className="mr-1.5 h-3.5 w-3.5" /> Enregistrer
              </Button>
              <Button className="bg-gradient-primary shadow-elegant" onClick={() => finish("PDF")}><FileText className="mr-1.5 h-3.5 w-3.5" /> Générer le PDF</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
