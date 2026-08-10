import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText, Send, Copy, Euro, Percent, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Kpi, Panel, Field, Chip, Crumbs, quoteStatusTone } from "@/components/admin/ui";
import {
  useBackoffice, boStore, eur, eur2, pct, dShort, dTime, quoteTotalTTC, quoteCost, quoteMargin, quoteMarginPct, MARGIN_THRESHOLD,
} from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/devis/$quoteId")({
  head: ({ params }) => ({
    meta: [
      { title: `Devis ${params.quoteId} — Back-office AKWA` },
      { name: "description", content: `Détail interne du devis ${params.quoteId} : montants, marge réelle, versions et réponse client.` },
      { property: "og:title", content: `Devis ${params.quoteId} — Back-office AKWA` },
      { property: "og:description", content: "Suivi interne d'un devis export AKWA avec marge, historique et réponse client." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuoteDetail,
});

function QuoteDetail() {
  const { quoteId } = Route.useParams();
  const navigate = useNavigate();
  useBackoffice();
  const q = boStore.getQuote(quoteId);

  if (!q) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">Devis introuvable</h1>
        <Button className="mt-4" onClick={() => navigate({ to: "/admin/devis" })}>Retour aux devis</Button>
      </div>
    );
  }

  const client = boStore.getClient(q.clientId);
  const versions = boStore.versionsOf(q.family);
  const total = quoteTotalTTC(q);
  const mp = quoteMarginPct(q);
  const email = boStore.getEmails().find((e) => e.quoteId === q.id);

  return (
    <div className="max-w-[1500px] space-y-5">
      <Crumbs items={[{ label: "Back-office", to: "/admin" }, { label: "Devis", to: "/admin/devis" }, { label: q.id }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{q.id}</h1>
            <Chip tone={quoteStatusTone[q.status] ?? "muted"}>{q.status}</Chip>
            <Chip>Version {q.version}</Chip>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {client?.name} · commande{" "}
            <Link to="/admin/commandes/$reference" params={{ reference: q.orderRef }} className="font-medium text-foreground hover:underline">{q.orderRef}</Link>
            {" "}· créé le {dShort(q.createdAt)} par {q.createdBy}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="gap-1.5"><Link to="/admin/devis"><ArrowLeft className="h-4 w-4" /> Devis</Link></Button>
          {(q.status === "Refusé" || q.status === "Expiré") && (
            <Button className="gap-1.5" onClick={() => {
              const next = boStore.createVersion(q.id);
              if (next) { toast.success(`Version ${next.version} créée`); navigate({ to: "/admin/devis/generer/$reference", params: { reference: q.orderRef } }); }
            }}><Copy className="h-4 w-4" /> Créer une nouvelle version</Button>
          )}
          {q.status === "Brouillon" && (
            <Button asChild className="gap-1.5"><Link to="/admin/devis/generer/$reference" params={{ reference: q.orderRef }}><Send className="h-4 w-4" /> Reprendre l'édition</Link></Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Montant total" value={eur(total)} icon={Euro} />
        <Kpi label="Coût de revient" value={eur(quoteCost(q))} icon={Euro} />
        <Kpi label="Marge réelle" value={eur(quoteMargin(q))} icon={Percent}
          tone={mp < MARGIN_THRESHOLD ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"} />
        <Kpi label="Taux de marge" value={pct(mp)} sub={`Validité ${dShort(q.validUntil)}`} icon={Percent} tone="bg-ai/15 text-ai" />
      </div>

      {q.refusal && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <div className="font-semibold text-destructive">Devis refusé par le client — {q.refusal.reason}</div>
          <p className="mt-1 text-muted-foreground">{q.refusal.message}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{dTime(q.refusal.at)}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Contenu du devis">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Ligne</th>
                <th className="px-3 py-2 text-right font-medium">Qté</th>
                <th className="px-3 py-2 text-right font-medium">PU</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.items.map((i) => (
                <tr key={i.ref}>
                  <td className="px-3 py-2">{i.label}</td>
                  <td className="px-3 py-2 text-right">{i.quantity.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2 text-right">{eur2(i.unitPrice)}</td>
                  <td className="px-3 py-2 text-right font-medium">{eur(i.unitPrice * i.quantity)}</td>
                </tr>
              ))}
              {q.fees.map((f) => (
                <tr key={f.id} className="bg-muted/20">
                  <td className="px-3 py-2">{f.description || f.type}</td>
                  <td className="px-3 py-2 text-right">{f.quantity}</td>
                  <td className="px-3 py-2 text-right">{eur2(f.price)}</td>
                  <td className="px-3 py-2 text-right font-medium">{eur(f.price * f.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-semibold"><tr><td colSpan={3} className="px-3 py-2 text-right">Total</td><td className="px-3 py-2 text-right">{eur(total)}</td></tr></tfoot>
          </table>
        </Panel>

        <div className="space-y-4">
          <Panel title="Conditions">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Incoterm" value={q.conditions.incoterm} />
              <Field label="Paiement" value={q.conditions.paymentTerms} />
              <Field label="Préparation" value={q.conditions.preparationDelay} />
              <Field label="Transport" value={q.conditions.transportMode} />
              <Field label="Port de départ" value={q.conditions.portDeparture} />
              <Field label="Port d'arrivée" value={q.conditions.portDestination} />
            </div>
          </Panel>

          <Panel title="Versions du devis">
            <div className="space-y-2">
              {versions.map((v) => (
                <Link key={v.id} to="/admin/devis/$quoteId" params={{ quoteId: v.id }}
                  className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-smooth hover:bg-muted/40",
                    v.id === q.id ? "border-primary bg-primary/5" : "border-border")}>
                  <span>V{v.version} · {dShort(v.createdAt)}</span>
                  <span className="flex items-center gap-2"><Chip tone={quoteStatusTone[v.status] ?? "muted"}>{v.status}</Chip>{eur(quoteTotalTTC(v))}</span>
                </Link>
              ))}
            </div>
          </Panel>

          {email && (
            <Panel title="Email envoyé au client">
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
                <div className="flex items-center gap-2 font-medium"><Mail className="h-3.5 w-3.5" /> {email.subject}</div>
                <div className="mt-1 text-muted-foreground">À : {email.to} · {dTime(email.at)}</div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-muted-foreground">{email.body}</pre>
              </div>
            </Panel>
          )}

          <Panel title="Historique">
            <ol className="space-y-2.5">
              {q.history.map((h, i) => (
                <li key={i} className="text-sm">
                  <div className="font-medium">{h.label}</div>
                  <div className="text-[11px] text-muted-foreground">{dTime(h.at)} · {h.user}{h.detail ? ` · ${h.detail}` : ""}</div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
