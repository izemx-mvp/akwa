import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Euro, Percent, Package, Sparkles, Plus, ShoppingCart, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Kpi, Panel, Field, Chip, Crumbs, Bar, orderStatusTone, quoteStatusTone } from "@/components/admin/ui";
import {
  useBackoffice, boStore, eur, eur2, pct, dShort, dTime, goodsTotal, goodsCost, orderCostTotal, quoteTotalTTC,
  MARGIN_THRESHOLD, type OrderStatus,
} from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/commandes/$reference")({
  head: ({ params }) => ({
    meta: [
      { title: `Commande ${params.reference} — Back-office AKWA` },
      { name: "description", content: `Analyse interne de la commande ${params.reference} : coûts réels, marge, validation et génération du devis.` },
      { property: "og:title", content: `Commande ${params.reference} — Back-office AKWA` },
      { property: "og:description", content: "Vue interne d'une commande export : coûts, marge réelle, risques et workflow de validation." },
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
  const o = boStore.getOrder(reference);
  const [note, setNote] = useState({ text: "", tag: "Commercial" });
  const [refusal, setRefusal] = useState("");

  if (!o) {
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
  const sale = goodsTotal(o.items);
  const cost = goodsCost(o.items);
  const totalCost = orderCostTotal(o.costs);
  const margin = sale - cost;
  const marginPct = sale ? (margin / sale) * 100 : 0;
  const netMargin = sale - totalCost;
  const netMarginPct = sale ? (netMargin / sale) * 100 : 0;
  const canValidate = o.status === "Commande reçue" || o.status === "En attente d'informations";
  const canQuote = o.status === "Commande validée par AKWA" || o.status === "Révision devis";

  const validate = () => {
    boStore.validateOrder(o.reference);
    toast.success("Commande validée", { description: "Vous pouvez maintenant générer le devis." });
  };

  const refuse = () => {
    boStore.setOrderStatus(o.reference, "Refusée" as OrderStatus, refusal);
    toast.error("Commande refusée", { description: refusal || "Motif non précisé" });
  };

  const costLines: { label: string; value: number }[] = [
    { label: "Coût marchandises", value: o.costs.goods },
    { label: "Préparation & conditionnement", value: o.costs.preparation },
    { label: "Transport local", value: o.costs.localTransport },
    { label: "Fret maritime", value: o.costs.freight },
    { label: "Assurance", value: o.costs.insurance },
    { label: "Documentation export", value: o.costs.documents },
    { label: "Autres coûts", value: o.costs.other },
  ];

  return (
    <div className="max-w-[1600px] space-y-5">
      <Crumbs items={[{ label: "Back-office", to: "/admin" }, { label: "Commandes", to: "/admin/commandes" }, { label: o.reference }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{o.reference}</h1>
            <Chip tone={orderStatusTone[o.status] ?? "muted"}>{o.status}</Chip>
            <Chip tone={o.priority === "Critique" ? "danger" : o.priority === "Haute" ? "warning" : "muted"}>Priorité {o.priority.toLowerCase()}</Chip>
            <Chip tone={o.risk === "Faible" ? "success" : o.risk === "Modéré" ? "warning" : "danger"}>Risque {o.risk.toLowerCase()}</Chip>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link to="/admin/clients/$clientId" params={{ clientId: client.id }} className="font-medium text-foreground hover:underline">{client.name}</Link>
            {" "}· reçue le {dShort(o.receivedAt)} via {o.channel} · {o.destination}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="gap-1.5"><Link to="/admin/commandes"><ArrowLeft className="h-4 w-4" /> Commandes</Link></Button>
          {canValidate && (
            <>
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" className="gap-1.5 text-destructive"><XCircle className="h-4 w-4" /> Refuser</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Refuser la commande {o.reference}</DialogTitle></DialogHeader>
                  <div className="space-y-1.5"><Label>Motif interne</Label><Textarea rows={4} value={refusal} onChange={(e) => setRefusal(e.target.value)} placeholder="Capacité de production insuffisante, risque client…" /></div>
                  <DialogFooter><Button variant="destructive" onClick={refuse}>Confirmer le refus</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Button onClick={validate} className="gap-1.5"><CheckCircle2 className="h-4 w-4" /> Valider la commande</Button>
            </>
          )}
          {canQuote && (
            <Button asChild className="gap-1.5 bg-gradient-primary">
              <Link to="/admin/devis/generer/$reference" params={{ reference: o.reference }}><Sparkles className="h-4 w-4" /> Générer le devis</Link>
            </Button>
          )}
        </div>
      </div>

      {o.missingDocs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="font-medium">Informations manquantes :</span>
          {o.missingDocs.map((d) => <Chip key={d} tone="warning">{d}</Chip>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Valeur commande" value={eur(sale)} sub={`${o.items.length} références`} icon={Euro} />
        <Kpi label="Coût marchandises" value={eur(cost)} icon={Package} />
        <Kpi label="Marge brute" value={eur(margin)} sub={pct(marginPct)} icon={Percent}
          tone={marginPct < MARGIN_THRESHOLD ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"} />
        <Kpi label="Coût de revient total" value={eur(totalCost)} icon={Package} />
        <Kpi label="Marge nette estimée" value={eur(netMargin)} sub={pct(netMarginPct)} icon={Percent}
          tone={netMarginPct < MARGIN_THRESHOLD ? "bg-warning/15 text-warning" : "bg-ai/15 text-ai"} />
        <Kpi label="Échéance devis" value={dShort(o.quoteDeadline)} sub={`Expédition ${dShort(o.shipDeadline)}`} icon={AlertTriangle} tone="bg-warning/15 text-warning" />
      </div>

      {netMarginPct < MARGIN_THRESHOLD && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="mr-1.5 inline h-4 w-4" />
          Marge nette sous le seuil critique de {MARGIN_THRESHOLD} % — validation d'un responsable requise avant envoi du devis.
        </div>
      )}

      <Tabs defaultValue="articles">
        <TabsList className="flex-wrap">
          <TabsTrigger value="articles">Articles & marges</TabsTrigger>
          <TabsTrigger value="couts">Analyse financière</TabsTrigger>
          <TabsTrigger value="logistique">Logistique</TabsTrigger>
          <TabsTrigger value="devis">Devis ({quotes.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes internes</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-4">
          <Panel title="Détail des articles" description="Prix d'achat et marges strictement internes.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Référence</th>
                    <th className="px-3 py-2 text-left font-medium">Produit</th>
                    <th className="px-3 py-2 text-right font-medium">Quantité</th>
                    <th className="px-3 py-2 text-right font-medium">PU achat</th>
                    <th className="px-3 py-2 text-right font-medium">PU vente</th>
                    <th className="px-3 py-2 text-right font-medium">Total vente</th>
                    <th className="px-3 py-2 text-right font-medium">Marge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {o.items.map((i) => {
                    const m = (i.unitPrice - i.purchasePrice) * i.quantity;
                    const mp = i.unitPrice ? ((i.unitPrice - i.purchasePrice) / i.unitPrice) * 100 : 0;
                    return (
                      <tr key={i.ref} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono text-xs">{i.ref}</td>
                        <td className="px-3 py-2">{i.label}</td>
                        <td className="px-3 py-2 text-right">{i.quantity.toLocaleString("fr-FR")} {i.unit}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{eur2(i.purchasePrice)}</td>
                        <td className="px-3 py-2 text-right">{eur2(i.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{eur(i.unitPrice * i.quantity)}</td>
                        <td className={cn("px-3 py-2 text-right", mp < MARGIN_THRESHOLD ? "text-destructive" : "text-success")}>
                          {eur(m)}<div className="text-[11px]">{pct(mp)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/30 font-semibold">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right">Total</td>
                    <td className="px-3 py-2 text-right">{eur(sale)}</td>
                    <td className="px-3 py-2 text-right text-success">{eur(margin)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="couts" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Structure de coût de revient">
            <div className="space-y-2.5">
              {costLines.map((l) => (
                <div key={l.label} className="flex items-center gap-3">
                  <span className="w-52 shrink-0 text-sm">{l.label}</span>
                  <Bar value={(l.value / (totalCost || 1)) * 100} />
                  <span className="w-24 text-right text-sm font-medium">{eur(l.value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Coût de revient total</span><span>{eur(totalCost)}</span>
            </div>
          </Panel>
          <Panel title="Synthèse de rentabilité">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Chiffre d'affaires prévisionnel" value={eur(sale)} />
              <Field label="Coût de revient" value={eur(totalCost)} />
              <Field label="Marge nette" value={<span className={netMarginPct < MARGIN_THRESHOLD ? "text-destructive" : "text-success"}>{eur(netMargin)}</span>} />
              <Field label="Taux de marge nette" value={pct(netMarginPct)} />
              <Field label="Incoterm" value={o.incoterm} />
              <Field label="Devise" value={o.currency} />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Marge nette</span><span>objectif 25 %</span></div>
              <Bar value={netMarginPct * 4} tone={netMarginPct < MARGIN_THRESHOLD ? "bg-destructive" : netMarginPct < 25 ? "bg-warning" : "bg-success"} />
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="logistique" className="mt-4">
          <Panel title="Paramètres logistiques">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="Port de départ" value={o.portDeparture} />
              <Field label="Port de destination" value={o.portDestination} />
              <Field label="Destination finale" value={o.destination} />
              <Field label="Incoterm" value={o.incoterm} />
              <Field label="Commercial" value={o.commercial} />
              <Field label="Responsable export" value={o.exportManager} />
              <Field label="Échéance devis" value={dShort(o.quoteDeadline)} />
              <Field label="Échéance expédition" value={dShort(o.shipDeadline)} />
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="devis" className="mt-4">
          <Panel title="Devis liés à cette commande" action={canQuote ? (
            <Button asChild size="sm" className="gap-1.5"><Link to="/admin/devis/generer/$reference" params={{ reference: o.reference }}><Sparkles className="h-4 w-4" /> Agent Devis</Link></Button>
          ) : undefined}>
            <div className="divide-y divide-border">
              {quotes.map((q) => (
                <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground" />{q.id} <Chip tone={quoteStatusTone[q.status] ?? "muted"}>{q.status}</Chip>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Version {q.version} · créé le {dShort(q.createdAt)} par {q.createdBy}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{eur(quoteTotalTTC(q))}</span>
                    <Button asChild size="sm" variant="outline"><Link to="/admin/devis/$quoteId" params={{ quoteId: q.id }}>Ouvrir</Link></Button>
                  </div>
                </div>
              ))}
              {quotes.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucun devis généré pour cette commande.</p>}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
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
