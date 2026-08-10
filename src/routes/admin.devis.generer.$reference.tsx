import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Sparkles, Plus, Trash2, Send, Save, Percent, Euro, AlertTriangle, Eye, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Kpi, Panel, Field, Chip, Crumbs } from "@/components/admin/ui";
import {
  useBackoffice, boStore, eur, eur2, pct, dShort, goodsTotal, goodsCost, feesPrice, feesCost,
  quoteTotalTTC, quoteCost, quoteMargin, quoteMarginPct, FEE_TYPES, MARGIN_THRESHOLD, type FeeType,
} from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/devis/generer/$reference")({
  head: ({ params }) => ({
    meta: [
      { title: `Agent Devis ${params.reference} — Back-office AKWA` },
      { name: "description", content: `Génération assistée du devis export pour la commande ${params.reference} : frais, marges et envoi client.` },
      { property: "og:title", content: `Agent Devis ${params.reference} — Back-office AKWA` },
      { property: "og:description", content: "Composez les frais export, contrôlez la marge réelle et envoyez le devis au client." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuoteAgent,
});

const SUGGESTED: { type: FeeType; description: string; cost: number; price: number }[] = [
  { type: "Fret maritime", description: "Conteneur 40' HC Casablanca → destination", cost: 2150, price: 2650 },
  { type: "Assurance", description: "Assurance marchandises tous risques 110 %", cost: 320, price: 480 },
  { type: "Frais de préparation", description: "Préparation, palettisation et filmage", cost: 640, price: 950 },
  { type: "Transport local", description: "Acheminement usine → port de Casablanca", cost: 380, price: 560 },
  { type: "Documentation export", description: "Certificats, EUR.1, connaissement", cost: 180, price: 320 },
  { type: "Frais portuaires", description: "THC et manutention portuaire", cost: 260, price: 390 },
];

function QuoteAgent() {
  const { reference } = Route.useParams();
  const navigate = useNavigate();
  useBackoffice();
  const order = boStore.getOrder(reference);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [fee, setFee] = useState({ type: "Fret maritime" as FeeType, description: "", cost: 0, price: 0, quantity: 1, vat: 0, comment: "" });

  useEffect(() => {
    if (order && !quoteId) setQuoteId(boStore.startDraft(order.reference).id);
  }, [order, quoteId]);

  const quote = quoteId ? boStore.getQuote(quoteId) : undefined;

  const totals = useMemo(() => {
    if (!quote) return null;
    const goods = goodsTotal(quote.items);
    const gCost = goodsCost(quote.items);
    const fPrice = feesPrice(quote.fees);
    const fCost = feesCost(quote.fees);
    return {
      goods, gCost, fPrice, fCost,
      total: quoteTotalTTC(quote), cost: quoteCost(quote),
      margin: quoteMargin(quote), marginPct: quoteMarginPct(quote),
    };
  }, [quote]);

  if (!order) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">Commande introuvable</h1>
        <Button className="mt-4" onClick={() => navigate({ to: "/admin/commandes" })}>Retour aux commandes</Button>
      </div>
    );
  }
  if (!quote || !totals) return <p className="py-20 text-center text-sm text-muted-foreground">Initialisation de l'Agent Devis…</p>;

  const client = boStore.clientOf(order);
  const locked = quote.status !== "Brouillon" && quote.status !== "Validé";

  const addSuggested = (s: (typeof SUGGESTED)[number]) => {
    boStore.addFee(quote.id, { ...s, quantity: 1, vat: 0, comment: "Proposé par l'Agent Devis" });
    toast.success(`${s.type} ajouté au devis`);
  };

  const send = () => {
    boStore.sendQuote(quote.id);
    toast.success("Devis envoyé au client", { description: `${quote.id} · ${eur(totals.total)}` });
    navigate({ to: "/admin/devis/$quoteId", params: { quoteId: quote.id } });
  };

  return (
    <div className="max-w-[1600px] space-y-5">
      <Crumbs items={[{ label: "Back-office", to: "/admin" }, { label: "Devis", to: "/admin/devis" }, { label: `Agent Devis ${order.reference}` }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-ai/15 text-ai"><Sparkles className="h-4 w-4" /></span>
            <h1 className="text-2xl font-bold tracking-tight">Agent Devis</h1>
            <Chip tone="ai">{quote.id}</Chip>
            <Chip tone={quote.status === "Brouillon" ? "muted" : "info"}>{quote.status}</Chip>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Commande {order.reference} · {client.name} · {order.destination} · {quote.items.length} articles repris automatiquement
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="gap-1.5">
            <Link to="/admin/commandes/$reference" params={{ reference: order.reference }}><ArrowLeft className="h-4 w-4" /> Commande</Link>
          </Button>
          <Button variant="outline" disabled={locked} onClick={() => { boStore.saveDraft(quote.id); toast.success("Brouillon enregistré"); }} className="gap-1.5">
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={locked} className="gap-1.5 bg-gradient-primary"><Send className="h-4 w-4" /> Valider et envoyer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Envoyer le devis {quote.id}</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Destinataire</span><span className="font-medium">{client.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Montant total</span><span className="font-semibold">{eur(totals.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Marge réelle</span><span className={cn("font-semibold", totals.marginPct < MARGIN_THRESHOLD ? "text-destructive" : "text-success")}>{pct(totals.marginPct)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Validité</span><span>{dShort(quote.validUntil)}</span></div>
                {totals.marginPct < MARGIN_THRESHOLD && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                    Marge sous le seuil critique de {MARGIN_THRESHOLD} %. Confirmez uniquement après arbitrage commercial.
                  </p>
                )}
              </div>
              <DialogFooter><Button onClick={send} className="gap-1.5"><Send className="h-4 w-4" /> Confirmer l'envoi</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Marchandises" value={eur(totals.goods)} sub={`Coût ${eur(totals.gCost)}`} icon={Euro} />
        <Kpi label="Frais export" value={eur(totals.fPrice)} sub={`Coût ${eur(totals.fCost)}`} icon={Plus} />
        <Kpi label="Total devis" value={eur(totals.total)} icon={FileText} tone="bg-primary/10 text-primary" />
        <Kpi label="Coût de revient" value={eur(totals.cost)} icon={Euro} />
        <Kpi label="Marge réelle" value={eur(totals.margin)} icon={Percent}
          tone={totals.marginPct < MARGIN_THRESHOLD ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"} />
        <Kpi label="Taux de marge" value={pct(totals.marginPct)} icon={Percent} tone="bg-ai/15 text-ai" />
      </div>

      {totals.marginPct < MARGIN_THRESHOLD && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="mr-1.5 inline h-4 w-4" /> Marge globale inférieure à {MARGIN_THRESHOLD} % : ajustez les frais ou les prix de vente.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <Panel title="Articles de la commande" description="Repris automatiquement, prix modifiables.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Produit</th>
                    <th className="px-3 py-2 text-right font-medium">Qté</th>
                    <th className="px-3 py-2 text-right font-medium">PU achat</th>
                    <th className="px-3 py-2 text-right font-medium">PU vente</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                    <th className="px-3 py-2 text-right font-medium">Marge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quote.items.map((i) => {
                    const mp = i.unitPrice ? ((i.unitPrice - i.purchasePrice) / i.unitPrice) * 100 : 0;
                    return (
                      <tr key={i.ref}>
                        <td className="px-3 py-2">{i.label}<div className="font-mono text-[11px] text-muted-foreground">{i.ref}</div></td>
                        <td className="px-3 py-2 text-right">
                          <Input type="number" disabled={locked} className="ml-auto h-8 w-24 text-right" value={i.quantity}
                            onChange={(e) => boStore.updateQuoteItem(quote.id, i.ref, { quantity: Number(e.target.value) })} />
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{eur2(i.purchasePrice)}</td>
                        <td className="px-3 py-2 text-right">
                          <Input type="number" step="0.01" disabled={locked} className="ml-auto h-8 w-24 text-right" value={i.unitPrice}
                            onChange={(e) => boStore.updateQuoteItem(quote.id, i.ref, { unitPrice: Number(e.target.value) })} />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{eur(i.unitPrice * i.quantity)}</td>
                        <td className={cn("px-3 py-2 text-right", mp < MARGIN_THRESHOLD ? "text-destructive" : "text-success")}>{pct(mp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Frais export ajoutés" description="Le client ne voit que le prix facturé, jamais le coût réel." action={
            <Dialog>
              <DialogTrigger asChild><Button size="sm" disabled={locked} className="gap-1.5"><Plus className="h-4 w-4" /> Ajouter un frais</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau frais</DialogTitle></DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Type de frais</Label>
                    <Select value={fee.type} onValueChange={(v) => setFee({ ...fee, type: v as FeeType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{FEE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2"><Label>Description client</Label><Input value={fee.description} onChange={(e) => setFee({ ...fee, description: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Coût réel (€)</Label><Input type="number" step="0.01" value={fee.cost} onChange={(e) => setFee({ ...fee, cost: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5"><Label>Prix facturé (€)</Label><Input type="number" step="0.01" value={fee.price} onChange={(e) => setFee({ ...fee, price: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5"><Label>Quantité</Label><Input type="number" value={fee.quantity} onChange={(e) => setFee({ ...fee, quantity: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5"><Label>TVA (%)</Label><Input type="number" value={fee.vat} onChange={(e) => setFee({ ...fee, vat: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5 sm:col-span-2"><Label>Commentaire interne</Label><Textarea rows={2} value={fee.comment} onChange={(e) => setFee({ ...fee, comment: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button disabled={fee.price <= 0} onClick={() => {
                    boStore.addFee(quote.id, fee);
                    setFee({ type: "Fret maritime", description: "", cost: 0, price: 0, quantity: 1, vat: 0, comment: "" });
                    toast.success("Frais ajouté");
                  }}>Ajouter au devis</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }>
            <div className="space-y-2">
              {quote.fees.map((f) => {
                const m = (f.price - f.cost) * f.quantity;
                return (
                  <div key={f.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium"><Chip tone="info">{f.type}</Chip>{f.description}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">Ajouté par {f.createdBy} · {dShort(f.createdAt)}{f.comment ? ` · ${f.comment}` : ""}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold">{eur(f.price * f.quantity)}</div>
                          <div className={cn("text-[11px]", m >= 0 ? "text-success" : "text-destructive")}>coût {eur(f.cost * f.quantity)} · marge {eur(m)}</div>
                        </div>
                        <Button size="icon" variant="ghost" disabled={locked} onClick={() => boStore.removeFee(quote.id, f.id)} aria-label="Supprimer le frais">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {quote.fees.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aucun frais ajouté pour l'instant.</p>}
            </div>

            {!locked && (
              <div className="mt-4 rounded-lg border border-ai/40 bg-ai/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-ai"><Sparkles className="h-4 w-4" /> Frais suggérés par l'Agent Devis</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTED.filter((s) => !quote.fees.some((f) => f.type === s.type)).map((s) => (
                    <Button key={s.type} size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => addSuggested(s)}>
                      <Plus className="h-3.5 w-3.5" /> {s.type} · {eur(s.price)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Conditions commerciales">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Incoterm</Label><Input disabled={locked} value={quote.conditions.incoterm} onChange={(e) => boStore.patchQuote(quote.id, { conditions: { ...quote.conditions, incoterm: e.target.value } })} /></div>
              <div className="space-y-1.5"><Label>Conditions de paiement</Label><Input disabled={locked} value={quote.conditions.paymentTerms} onChange={(e) => boStore.patchQuote(quote.id, { conditions: { ...quote.conditions, paymentTerms: e.target.value } })} /></div>
              <div className="space-y-1.5"><Label>Délai de préparation</Label><Input disabled={locked} value={quote.conditions.preparationDelay} onChange={(e) => boStore.patchQuote(quote.id, { conditions: { ...quote.conditions, preparationDelay: e.target.value } })} /></div>
              <div className="space-y-1.5"><Label>Mode de transport</Label><Input disabled={locked} value={quote.conditions.transportMode} onChange={(e) => boStore.patchQuote(quote.id, { conditions: { ...quote.conditions, transportMode: e.target.value } })} /></div>
              <div className="space-y-1.5"><Label>Port de départ</Label><Input disabled={locked} value={quote.conditions.portDeparture} onChange={(e) => boStore.patchQuote(quote.id, { conditions: { ...quote.conditions, portDeparture: e.target.value } })} /></div>
              <div className="space-y-1.5"><Label>Port de destination</Label><Input disabled={locked} value={quote.conditions.portDestination} onChange={(e) => boStore.patchQuote(quote.id, { conditions: { ...quote.conditions, portDestination: e.target.value } })} /></div>
              <div className="space-y-1.5"><Label>Validité du devis</Label>
                <Input type="date" disabled={locked} value={quote.validUntil.slice(0, 10)}
                  onChange={(e) => boStore.patchQuote(quote.id, { validUntil: new Date(e.target.value).toISOString() })} />
              </div>
              <div className="space-y-1.5"><Label>Conditions particulières</Label><Input disabled={locked} value={quote.conditions.specialTerms} onChange={(e) => boStore.patchQuote(quote.id, { conditions: { ...quote.conditions, specialTerms: e.target.value } })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Notes visibles par le client</Label><Textarea rows={2} disabled={locked} value={quote.conditions.notes} onChange={(e) => boStore.patchQuote(quote.id, { conditions: { ...quote.conditions, notes: e.target.value } })} /></div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Panel title="Aperçu client" description="Ce que verra le client dans son portail.">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="text-sm font-bold">DEVIS {quote.id}</div>
                  <div className="text-[11px] text-muted-foreground">AKWA Export · {dShort(quote.createdAt)}</div>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  <div>{client.name}</div><div>{client.city}, {client.country}</div>
                </div>
              </div>
              <div className="space-y-1.5 py-3 text-xs">
                {quote.items.map((i) => (
                  <div key={i.ref} className="flex justify-between gap-3">
                    <span className="truncate text-muted-foreground">{i.label} × {i.quantity.toLocaleString("fr-FR")}</span>
                    <span>{eur(i.unitPrice * i.quantity)}</span>
                  </div>
                ))}
                {quote.fees.map((f) => (
                  <div key={f.id} className="flex justify-between gap-3">
                    <span className="truncate text-muted-foreground">{f.description || f.type}</span>
                    <span>{eur(f.price * f.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-bold">
                <span>Total</span><span>{eur(totals.total)}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <span>Incoterm : {quote.conditions.incoterm}</span>
                <span>Validité : {dShort(quote.validUntil)}</span>
                <span>Paiement : {quote.conditions.paymentTerms}</span>
                <span>Départ : {quote.conditions.portDeparture}</span>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Eye className="h-3 w-3" /> Les coûts internes et marges ne sont jamais transmis.
            </p>
          </Panel>

          <Panel title="Contrôle de marge">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Marchandises</span><span>{eur(totals.goods)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frais export</span><span>{eur(totals.fPrice)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total facturé</span><span>{eur(totals.total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coût de revient</span><span>{eur(totals.cost)}</span></div>
              <div className={cn("flex justify-between font-semibold", totals.marginPct < MARGIN_THRESHOLD ? "text-destructive" : "text-success")}>
                <span>Marge réelle</span><span>{eur(totals.margin)} · {pct(totals.marginPct)}</span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs">
              <Field label="Client" value={`${client.name} · ${client.paymentTerms}`} />
              <Field label="Historique client" value={`${client.ordersCount} commandes · acceptation ${pct(client.quoteAcceptRate)}`} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
