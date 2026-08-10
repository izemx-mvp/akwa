import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Euro, Percent, Package, ShoppingCart, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Kpi, Panel, Field, Chip, Crumbs, orderStatusTone } from "@/components/admin/ui";
import { OrderBillingPanel } from "@/components/admin/OrderBillingPanel";
import {
  StepBar, IntelligenceBlock, PricingSection, MarginSection, QuoteSection, WorkflowTimeline, DocumentsSection,
} from "@/components/admin/order/workflow";
import {
  useBackoffice, boStore, eur, eur2, pct, dShort, dTime, goodsTotal, MARGIN_THRESHOLD, type OrderStatus,
} from "@/lib/backoffice-store";
import {
  workflowStore, useOrderWorkflow, pricingSummary, marginBreakdown, steps as buildSteps,
} from "@/lib/order-workflow";

export const Route = createFileRoute("/admin/commandes/$reference")({
  head: ({ params }) => ({
    meta: [
      { title: `Commande ${params.reference} — Back-office AKWA` },
      { name: "description", content: `Workflow complet de la commande ${params.reference} : pricing, marge, validation AKWA et devis client.` },
      { property: "og:title", content: `Commande ${params.reference} — Back-office AKWA` },
      { property: "og:description", content: "Traitement intégré d'une commande export : Agent Pricing, Agent Marge, validation et Agent Devis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { reference } = Route.useParams();
  const navigate = useNavigate();
  useBackoffice();
  const flow = useOrderWorkflow(reference);
  const o = boStore.getOrder(reference);
  const [tab, setTab] = useState("apercu");
  const [note, setNote] = useState({ text: "", tag: "Commercial" });
  const [refusal, setRefusal] = useState("");

  useEffect(() => {
    if (boStore.getOrder(reference)) workflowStore.runAnalyses(reference);
  }, [reference]);

  const summary = useMemo(() => (o ? pricingSummary(o, flow) : null), [o, flow]);
  const margin = useMemo(() => (o && summary ? marginBreakdown(o, summary) : null), [o, summary]);

  if (!o || !summary || !margin) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">Commande introuvable</h1>
        <Button className="mt-4" onClick={() => navigate({ to: "/admin/commandes" })}>Retour aux commandes</Button>
      </div>
    );
  }

  const client = boStore.clientOf(o);
  const quotes = boStore.quotesOfOrder(o.reference);
  const steps = buildSteps(o, flow, quotes);
  const initial = goodsTotal(o.items);
  const canRefuse = o.status === "Commande reçue" || o.status === "En attente d'informations";

  const goTab = (t: string) => { setTab(t); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="max-w-[1600px] space-y-4">
      <Crumbs items={[{ label: "Back-office", to: "/admin" }, { label: "Commandes", to: "/admin/commandes" }, { label: o.reference }]} />

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{o.reference}</h1>
              <Chip tone={orderStatusTone[o.status] ?? "muted"}>{o.status}</Chip>
              <Chip tone={o.priority === "Critique" ? "danger" : o.priority === "Haute" ? "warning" : "muted"}>Priorité {o.priority.toLowerCase()}</Chip>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <Link to="/admin/clients/$clientId" params={{ clientId: client.id }} className="font-medium text-foreground hover:underline">{client.name}</Link>
              {" "}· {o.destination} · reçue le {dShort(o.receivedAt)} via {o.channel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild className="gap-1.5"><Link to="/admin/commandes"><ArrowLeft className="h-4 w-4" /> Commandes</Link></Button>
            {canRefuse && (
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" className="gap-1.5 text-destructive"><XCircle className="h-4 w-4" /> Refuser</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Refuser la commande {o.reference}</DialogTitle></DialogHeader>
                  <div className="space-y-1.5"><Label>Motif interne</Label><Textarea rows={4} value={refusal} onChange={(e) => setRefusal(e.target.value)} /></div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={() => {
                      boStore.setOrderStatus(o.reference, "Refusée" as OrderStatus, refusal);
                      workflowStore.logEvent(o.reference, "Commande refusée", refusal || "Motif non précisé");
                      toast.error("Commande refusée");
                    }}>Confirmer le refus</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Client" value={client.name} />
          <Field label="Destination" value={o.destination} />
          <Field label="Date" value={dShort(o.receivedAt)} />
          <Field label="Montant initial" value={eur(initial)} />
          <Field label="Prix retenu" value={eur(summary.currentTotal)} />
          <Field label="Statut" value={<Chip tone={orderStatusTone[o.status] ?? "muted"}>{o.status}</Chip>} />
        </div>
      </div>

      <StepBar steps={steps} />

      {o.missingDocs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="font-medium">Informations manquantes :</span>
          {o.missingDocs.map((d) => <Chip key={d} tone="warning">{d}</Chip>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="CA estimé" value={eur(margin.revenue)} sub={`${o.items.length} références`} icon={Euro} />
        <Kpi label="Coût total estimé" value={eur(margin.totalCost)} icon={Package} />
        <Kpi label="Marge estimée" value={eur(margin.margin)} sub={pct(margin.marginPct)} icon={Percent}
          tone={margin.marginPct < MARGIN_THRESHOLD ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"} />
        <Kpi label="Objectif AKWA" value={pct(margin.target)} sub={`Écart ${margin.gap >= 0 ? "+" : ""}${margin.gap.toFixed(1).replace(".", ",")} pts`} icon={Percent}
          tone={margin.gap < 0 ? "bg-warning/15 text-warning" : "bg-ai/15 text-ai"} />
        <Kpi label="Échéance devis" value={dShort(o.quoteDeadline)} sub={`Expédition ${dShort(o.shipDeadline)}`} icon={AlertTriangle} tone="bg-warning/15 text-warning" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="apercu">Vue générale</TabsTrigger>
          <TabsTrigger value="produits">Produits</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="rentabilite">Rentabilité</TabsTrigger>
          <TabsTrigger value="devis">Devis{quotes.length ? ` (${quotes.length})` : ""}</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="apercu" className="mt-4 space-y-4">
          <Panel title="Résumé de la commande">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Field label="Client" value={client.name} />
              <Field label="Destination" value={o.destination} />
              <Field label="Produits" value={`${o.items.length} références`} />
              <Field label="Quantités" value={`${o.items.reduce((s, i) => s + i.quantity, 0).toLocaleString("fr-FR")} unités`} />
              <Field label="Montant initial" value={eur(initial)} />
              <Field label="Incoterm" value={o.incoterm} />
              <Field label="Conditions de paiement" value={client.paymentTerms} />
              <Field label="Date souhaitée" value={dShort(o.shipDeadline)} />
              <Field label="Statut" value={o.status} />
              <Field label="Responsable AKWA" value={o.commercial} />
            </div>
          </Panel>

          <IntelligenceBlock flow={flow} summary={summary} margin={margin} onGo={goTab} quote={quotes[0]} />
        </TabsContent>

        <TabsContent value="produits" className="mt-4">
          <Panel title="Articles de la commande" description="Prix d'achat et marges strictement internes.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Référence</th>
                    <th className="px-3 py-2 text-left font-medium">Produit</th>
                    <th className="px-3 py-2 text-right font-medium">Quantité</th>
                    <th className="px-3 py-2 text-right font-medium">PU achat</th>
                    <th className="px-3 py-2 text-right font-medium">PU retenu</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                    <th className="px-3 py-2 text-right font-medium">Marge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summary.lines.map((l) => {
                    const m = (l.currentPrice - l.cost) * l.item.quantity;
                    return (
                      <tr key={l.item.ref} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono text-xs">{l.item.ref}</td>
                        <td className="px-3 py-2">{l.item.label}</td>
                        <td className="px-3 py-2 text-right">{l.item.quantity.toLocaleString("fr-FR")} {l.item.unit}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{eur2(l.cost)}</td>
                        <td className="px-3 py-2 text-right">{eur2(l.currentPrice)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{eur(l.currentPrice * l.item.quantity)}</td>
                        <td className={cn("px-3 py-2 text-right", l.marginPct < MARGIN_THRESHOLD ? "text-destructive" : "text-success")}>
                          {eur(m)}<div className="text-[11px]">{pct(l.marginPct)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <PricingSection order={o} flow={flow} summary={summary} onGo={goTab} />
        </TabsContent>

        <TabsContent value="rentabilite" className="mt-4">
          <MarginSection order={o} flow={flow} summary={summary} margin={margin} onGo={goTab} />
        </TabsContent>

        <TabsContent value="devis" className="mt-4 space-y-4">
          <QuoteSection order={o} flow={flow} quotes={quotes} onGo={goTab} />
          <OrderBillingPanel orderRef={o.reference} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsSection order={o} />
        </TabsContent>

        <TabsContent value="historique" className="mt-4 space-y-4">
          <WorkflowTimeline flow={flow} quotes={quotes} />
          <Panel title="Notes internes" description="Invisibles pour le client." action={
            <Dialog>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Ajouter</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Note interne — {o.reference}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Catégorie</Label>
                    <Select value={note.tag} onValueChange={(v) => setNote({ ...note, tag: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Commercial", "Logistique", "Financier", "Production", "Risque"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Note</Label><Textarea rows={4} value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button disabled={!note.text.trim()} onClick={() => {
                    boStore.addOrderNote(o.reference, { text: note.text.trim(), tag: note.tag, mentions: [] });
                    setNote({ text: "", tag: "Commercial" });
                    toast.success("Note ajoutée");
                  }}>Enregistrer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }>
            <div className="space-y-3">
              {o.internalNotes.map((n) => (
                <div key={n.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Chip tone="info">{n.tag}</Chip>
                    <span className="text-[11px] text-muted-foreground">{dTime(n.at)} · {n.author}</span>
                  </div>
                  <p className="mt-2 text-sm">{n.text}</p>
                </div>
              ))}
              {o.internalNotes.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucune note interne.</p>}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
