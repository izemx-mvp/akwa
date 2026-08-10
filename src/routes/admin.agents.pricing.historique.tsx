import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { History, RotateCcw } from "lucide-react";
import { Chip, Kpi, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { dShort, dTime, eur2, useBackoffice } from "@/lib/backoffice-store";
import { can, effectiveStatus, pricingStore, ruleStatusTone, usePricing } from "@/lib/pricing-rules";

export const Route = createFileRoute("/admin/agents/pricing/historique")({
  head: () => ({
    meta: [
      { title: "Historique des prix — Agent Pricing AKWA" },
      { name: "description", content: "Traçabilité complète des modifications de prix, batchs de modification massive et audit des règles tarifaires." },
      { property: "og:title", content: "Historique des prix — Agent Pricing AKWA" },
      { property: "og:description", content: "Audit, rollback et justification de chaque prix appliqué." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingHistory,
});

function PricingHistory() {
  const { batches, rules } = usePricing();
  const { products } = useBackoffice();
  const [rollback, setRollback] = useState<string | null>(null);

  const priceChanges = useMemo(
    () =>
      products
        .flatMap((p) => p.history.filter((h) => h.action.toLowerCase().includes("prix")).map((h) => ({ ...h, ref: p.ref, name: p.name })))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 30),
    [products],
  );

  const audit = useMemo(
    () => rules.flatMap((r) => r.audit.map((a) => ({ ...a, rule: r.name, id: r.id }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30),
    [rules],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Batchs de modification" value={String(batches.length)} icon={History} />
        <Kpi label="Produits modifiés" value={String(batches.reduce((s, b) => s + b.entries.length, 0))} />
        <Kpi label="Modifications de prix" value={String(priceChanges.length)} />
        <Kpi label="Événements d'audit" value={String(audit.length)} />
      </div>

      <Panel title="Modifications massives permanentes" description="Snapshots restaurables des prix catalogue.">
        <ul className="space-y-3">
          {batches.map((b) => (
            <li key={b.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{b.id} <Chip tone={b.restored ? "muted" : "success"}>{b.restored ? "Restauré" : "Appliqué"}</Chip></div>
                  <div className="text-[11px] text-muted-foreground">
                    {b.entries.length} produits · {b.scopeLabel} · {b.reason} · par {b.by} le {dShort(b.at)}
                  </div>
                </div>
                {!b.restored && (
                  <Button size="sm" variant="secondary" onClick={() => setRollback(b.id)}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restaurer les anciens prix
                  </Button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                {b.entries.map((e) => (
                  <span key={e.ref} className="rounded bg-muted px-2 py-0.5">{e.name} : {eur2(e.from)} → {eur2(e.to)}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Historique des prix produits">
          <ul className="space-y-2">
            {priceChanges.map((h, i) => (
              <li key={i} className="rounded-lg border border-border p-2.5 text-sm">
                <div className="flex justify-between"><span className="font-medium">{h.name}</span><span className="text-[11px] text-muted-foreground">{dTime(h.at)}</span></div>
                <div className="text-xs text-muted-foreground">
                  {h.action} — {h.from ?? "—"} → {h.to ?? "—"} · {h.user} · {h.ref}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Audit des règles tarifaires">
          <ul className="space-y-2">
            {audit.map((a, i) => (
              <li key={i} className="rounded-lg border border-border p-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{a.rule}</span>
                  <span className="text-[11px] text-muted-foreground">{dTime(a.at)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{a.action} par {a.user}{a.from || a.to ? ` — ${a.from ?? "—"} → ${a.to ?? "—"}` : ""}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Statut courant des règles">
        <div className="flex flex-wrap gap-2">
          {rules.map((r) => (
            <Chip key={r.id} tone={ruleStatusTone(effectiveStatus(r))}>{r.name} — {effectiveStatus(r)}</Chip>
          ))}
        </div>
      </Panel>

      <AlertDialog open={!!rollback} onOpenChange={(v) => !v && setRollback(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer les anciens prix ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les prix catalogue du batch {rollback} seront remis à leur valeur précédente. Cette action est tracée dans l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!can("modifier_prix_masse")) { toast.error("Permission insuffisante"); return; }
              pricingStore.rollback(rollback!); toast.success("Anciens prix restaurés"); setRollback(null);
            }}>
              Confirmer la restauration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
