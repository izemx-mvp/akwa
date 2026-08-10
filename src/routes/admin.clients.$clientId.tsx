import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Euro, TrendingUp, ShoppingCart, Clock, Plus, Users, FileText, MapPin, StickyNote, Save,
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
  useBackoffice, boStore, eur, pct, dShort, dTime, goodsTotal, quoteTotalTTC, type ClientNote,
} from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/clients/$clientId")({
  head: ({ params }) => ({
    meta: [
      { title: `Client ${params.clientId} — Fiche 360° AKWA` },
      { name: "description", content: "Fiche client 360° AKWA : identité, chiffre d'affaires, commandes, devis, paiements et notes internes." },
      { property: "og:title", content: `Client ${params.clientId} — Fiche 360° AKWA` },
      { property: "og:description", content: "Analyse complète du client : CA, marges, historique commandes et devis, risques et notes internes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientDetail,
});

function ClientDetail() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  useBackoffice();
  const c = boStore.getClient(clientId);
  const [note, setNote] = useState({ text: "", category: "Commercial" as ClientNote["category"] });
  const [edit, setEdit] = useState<Record<string, string>>({});

  if (!c) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Users className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">Client introuvable</h1>
        <Button className="mt-4" onClick={() => navigate({ to: "/admin/clients" })}>Retour au portefeuille</Button>
      </div>
    );
  }

  const orders = boStore.ordersOfClient(c.id);
  const quotes = boStore.quotesOfClient(c.id);
  const maxCa = Math.max(...c.monthly.map((m) => m.ca), 1);
  const maxCat = Math.max(...c.byCategory.map((x) => x.value), 1);

  const addNote = () => {
    if (!note.text.trim()) return;
    boStore.addClientNote(c.id, { text: note.text.trim(), category: note.category });
    setNote({ text: "", category: "Commercial" });
    toast.success("Note interne ajoutée");
  };

  const saveEdit = () => {
    boStore.updateClient(c.id, edit);
    setEdit({});
    toast.success("Fiche client mise à jour");
  };

  return (
    <div className="max-w-[1600px] space-y-5">
      <Crumbs items={[{ label: "Back-office", to: "/admin" }, { label: "Clients", to: "/admin/clients" }, { label: c.name }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
            <Chip tone={c.status === "Actif" ? "success" : "muted"}>{c.status}</Chip>
            <Chip tone={c.priority === "VIP" ? "ai" : "info"}>{c.priority}</Chip>
            <Chip tone={c.paymentRisk === "Faible" ? "success" : c.paymentRisk === "Modéré" ? "warning" : "danger"}>Risque {c.paymentRisk.toLowerCase()}</Chip>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {c.legalName} · {c.city}, {c.country} · Chargé de compte : {c.manager}
          </p>
        </div>
        <Button variant="outline" asChild className="gap-1.5"><Link to="/admin/clients"><ArrowLeft className="h-4 w-4" /> Portefeuille</Link></Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="CA total" value={eur(c.revenueTotal)} icon={Euro} />
        <Kpi label="CA année" value={eur(c.revenueYear)} icon={TrendingUp} tone="bg-primary/10 text-primary" />
        <Kpi label="Marge générée" value={eur(c.margin)} sub={pct((c.margin / (c.revenueTotal || 1)) * 100)} icon={TrendingUp} tone="bg-ai/15 text-ai" />
        <Kpi label="Commandes" value={c.ordersCount} sub={`${c.activeOrders} en cours`} icon={ShoppingCart} />
        <Kpi label="Encours" value={eur(c.balance)} sub={`Payé ${eur(c.paid)}`} icon={Clock} tone="bg-warning/15 text-warning" />
        <Kpi label="Score client" value={`${c.score}/100`} sub={`Acceptation devis ${pct(c.quoteAcceptRate)}`} icon={Users} tone="bg-success/15 text-success" />
      </div>

      <Tabs defaultValue="identite">
        <TabsList className="flex-wrap">
          <TabsTrigger value="identite">Identité</TabsTrigger>
          <TabsTrigger value="analyse">Analyse commerciale</TabsTrigger>
          <TabsTrigger value="commandes">Commandes ({orders.length})</TabsTrigger>
          <TabsTrigger value="devis">Devis ({quotes.length})</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="notes">Notes internes</TabsTrigger>
        </TabsList>

        <TabsContent value="identite" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Informations légales">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Raison sociale" value={c.legalName} />
              <Field label="Identifiant fiscal / ICE" value={c.ice} mono />
              <Field label="Adresse" value={`${c.address}, ${c.zip} ${c.city}`} />
              <Field label="Pays" value={c.country} />
              <Field label="Site web" value={c.website} />
              <Field label="Langue de travail" value={c.language} />
            </div>
          </Panel>
          <Panel title="Contacts">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact principal" value={c.contactMain} />
              <Field label="Contact facturation" value={c.contactFinance} />
              <Field label="Contact logistique" value={c.contactLogistics} />
              <Field label="Email" value={c.email} />
              <Field label="Téléphone" value={c.phone} />
              <Field label="Chargé de compte AKWA" value={c.manager} />
            </div>
          </Panel>
          <Panel title="Conditions commerciales" action={
            <Button size="sm" onClick={saveEdit} disabled={Object.keys(edit).length === 0} className="gap-1.5"><Save className="h-4 w-4" /> Enregistrer</Button>
          }>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Incoterm habituel</Label><Input value={edit.incoterm ?? c.incoterm} onChange={(e) => setEdit({ ...edit, incoterm: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Conditions de paiement</Label><Input value={edit.paymentTerms ?? c.paymentTerms} onChange={(e) => setEdit({ ...edit, paymentTerms: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Mode de transport</Label><Input value={edit.transport ?? c.transport} onChange={(e) => setEdit({ ...edit, transport: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Devise</Label><Input value={edit.currency ?? c.currency} onChange={(e) => setEdit({ ...edit, currency: e.target.value })} /></div>
            </div>
          </Panel>
          <Panel title="Destinations habituelles">
            <div className="space-y-2">
              {c.destinations.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="w-40 shrink-0 text-sm">{d.name}</span>
                  <Bar value={(d.value / Math.max(...c.destinations.map((x) => x.value), 1)) * 100} />
                  <span className="w-16 text-right text-xs text-muted-foreground">{d.value} exp.</span>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="analyse" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Évolution du chiffre d'affaires" description="12 derniers mois">
            <div className="flex h-48 items-end gap-1.5">
              {c.monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-primary/70" style={{ height: `${(m.ca / maxCa) * 140}px` }} title={eur(m.ca)} />
                  <span className="text-[9px] text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Répartition par catégorie">
            <div className="space-y-2.5">
              {c.byCategory.map((x) => (
                <div key={x.name} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-sm">{x.name}</span>
                  <Bar value={(x.value / maxCat) * 100} tone="bg-ai" />
                  <span className="w-24 text-right text-xs text-muted-foreground">{eur(x.value)}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Produits les plus commandés">
            <ol className="space-y-2">
              {c.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded bg-muted text-[11px]">{i + 1}</span>{p.name}</span>
                  <span className="font-medium">{eur(p.value)}</span>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Indicateurs comportementaux">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fréquence de commande" value={`${(c.ordersCount / 12).toFixed(1)} / mois`} />
              <Field label="Panier moyen" value={eur(c.revenueTotal / (c.ordersCount || 1))} />
              <Field label="Taux d'acceptation des devis" value={pct(c.quoteAcceptRate)} />
              <Field label="Délai moyen de paiement" value={`${c.avgPaymentDelay} jours`} />
              <Field label="Client depuis" value={dShort(c.since)} />
              <Field label="Dernière commande" value={dShort(c.lastOrder)} />
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="commandes" className="mt-4">
          <Panel title="Historique des commandes">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Référence</th>
                    <th className="px-3 py-2 text-left font-medium">Reçue le</th>
                    <th className="px-3 py-2 text-left font-medium">Destination</th>
                    <th className="px-3 py-2 text-right font-medium">Montant</th>
                    <th className="px-3 py-2 text-left font-medium">Statut</th>
                    <th className="px-3 py-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.reference} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{o.reference}</td>
                      <td className="px-3 py-2 text-muted-foreground">{dShort(o.receivedAt)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{o.destination}</td>
                      <td className="px-3 py-2 text-right font-semibold">{eur(goodsTotal(o.items))}</td>
                      <td className="px-3 py-2"><Chip tone={orderStatusTone[o.status] ?? "muted"}>{o.status}</Chip></td>
                      <td className="px-3 py-2 text-right">
                        <Button asChild size="sm" variant="outline"><Link to="/admin/commandes/$reference" params={{ reference: o.reference }}>Ouvrir</Link></Button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Aucune commande.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="devis" className="mt-4">
          <Panel title="Devis émis">
            <div className="divide-y divide-border">
              {quotes.map((q) => (
                <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground" />{q.id}
                      <Chip tone={quoteStatusTone[q.status] ?? "muted"}>{q.status}</Chip>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Commande {q.orderRef} · créé le {dShort(q.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{eur(quoteTotalTTC(q))}</span>
                    <Button asChild size="sm" variant="outline"><Link to="/admin/devis/$quoteId" params={{ quoteId: q.id }}>Ouvrir</Link></Button>
                  </div>
                </div>
              ))}
              {quotes.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucun devis émis pour ce client.</p>}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="finances" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Situation financière">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Total facturé" value={eur(c.revenueTotal)} />
              <Field label="Total encaissé" value={eur(c.paid)} />
              <Field label="Encours" value={<span className={cn(c.balance > 0 && "text-warning")}>{eur(c.balance)}</span>} />
              <Field label="Délai moyen de paiement" value={`${c.avgPaymentDelay} jours`} />
              <Field label="Conditions" value={c.paymentTerms} />
              <Field label="Niveau de risque" value={c.paymentRisk} />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Taux d'encaissement</span><span>{pct((c.paid / (c.revenueTotal || 1)) * 100)}</span>
              </div>
              <Bar value={(c.paid / (c.revenueTotal || 1)) * 100} tone="bg-success" />
            </div>
          </Panel>
          <Panel title="Paiements mensuels">
            <div className="flex h-48 items-end gap-1.5">
              {c.monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-success/70" style={{ height: `${(m.paid / maxCa) * 140}px` }} title={eur(m.paid)} />
                  <span className="text-[9px] text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Panel title="Notes internes" description="Jamais visibles par le client." action={
            <Dialog>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Ajouter une note</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle note interne</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Catégorie</Label>
                    <Select value={note.category} onValueChange={(v) => setNote({ ...note, category: v as ClientNote["category"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Commercial", "Logistique", "Financier", "Risque"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Note</Label><Textarea rows={4} value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={addNote} disabled={!note.text.trim()}>Enregistrer la note</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          }>
            <div className="space-y-3">
              {c.notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Chip tone={n.category === "Risque" ? "danger" : n.category === "Financier" ? "warning" : "info"}>{n.category}</Chip>
                    <span className="text-[11px] text-muted-foreground">{dTime(n.at)} · {n.author}</span>
                  </div>
                  <p className="mt-2 flex gap-2 text-sm"><StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />{n.text}</p>
                </div>
              ))}
              {c.notes.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucune note interne.</p>}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
