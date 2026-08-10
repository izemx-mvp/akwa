import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, FileText, CheckCircle2, XCircle, Clock, Send, Paperclip, Package, GitCompareArrows,
  History, MessagesSquare, ShieldCheck, Building2, Ship, Info, Download, Eye, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { DecisionZone } from "@/components/quote/QuoteDecision";
import { cn } from "@/lib/utils";
import {
  quotesStore, useQuotes, quoteTotal, goodsTotal, statusStyle, eur, eur2, dateFR, dateShort,
  dateTimeFR, daysLeft, downloadQuotePdf, type Quote,
} from "@/lib/quotes-store";

export const Route = createFileRoute("/client/devis/$quoteId")({
  head: () => ({
    meta: [
      { title: "Détail du devis — Portail client AKWA" },
      { name: "description", content: "Consultez le détail d'un devis export AKWA : articles, synthèse financière, conditions commerciales, validation signée ou refus motivé." },
      { property: "og:title", content: "Détail du devis — Portail client AKWA" },
      { property: "og:description", content: "Validez ou refusez votre devis export AKWA en quelques clics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuoteDetail,
});

const WORKFLOW = [
  "Commande validée par AKWA",
  "Devis généré",
  "Devis envoyé",
  "Validation client",
  "Devis signé",
  "Commande confirmée",
];

function workflowIndex(q: Quote) {
  if (q.status === "Accepté") return 5;
  if (q.status === "Refusé" || q.status === "En révision" || q.status === "Remplacé") return 3;
  if (q.status === "Expiré") return 3;
  return 3; // À valider / Envoyé
}

function Section({ title, subtitle, icon: Icon, children, action }: {
  title: string; subtitle?: string; icon: typeof FileText; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

function QuoteDetail() {
  const { quoteId } = Route.useParams();
  const quotes = useQuotes();
  const navigate = useNavigate();
  const quote = quotes.find((x) => x.id === quoteId);
  const [compare, setCompare] = useState(false);
  const [msg, setMsg] = useState("");
  const [attachment, setAttachment] = useState("");

  useEffect(() => {
    if (quote) quotesStore.markViewed(quote.id);
  }, [quote?.id]);

  const versions = useMemo(() => (quote ? quotesStore.versionsOf(quote.family) : []), [quotes, quote?.family]);

  if (!quote) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-xl font-bold">Devis introuvable</h1>
        <p className="text-sm text-muted-foreground">Le devis {quoteId} n'existe pas ou n'est plus disponible.</p>
        <Button asChild><Link to="/client/devis">Retour à mes devis</Link></Button>
      </div>
    );
  }

  const total = quoteTotal(quote);
  const goods = goodsTotal(quote);
  const step = workflowIndex(quote);
  const d = daysLeft(quote);
  const newer = versions.find((v) => v.version > quote.version);

  const send = () => {
    if (msg.trim().length < 2) return;
    quotesStore.addMessage(quote.id, msg.trim(), attachment || undefined);
    setMsg("");
    setAttachment("");
    toast.success("Message envoyé à AKWA");
  };

  return (
    <div className="max-w-[1400px] space-y-4 pb-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/client/devis" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Mes devis
        </Link>
        <span>/</span>
        <span className="text-foreground">{quote.id}</span>
      </div>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-elegant">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Devis {quote.id}</h1>
              <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-semibold">{quote.status}</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs">Version V{quote.version}</span>
            </div>
            <div className="mt-1 text-sm text-white/80">
              {quote.client} · {quote.destination}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-white/70">Montant du devis</div>
            <div className="text-3xl font-bold">{eur(total)}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <div><div className="text-[10px] uppercase tracking-wider text-white/60">Commande associée</div><div className="text-sm font-semibold">{quote.orderRef}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-white/60">Date d'émission</div><div className="text-sm font-semibold">{dateFR(quote.issuedAt)}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-white/60">Date de validité</div><div className="text-sm font-semibold">{dateFR(quote.validUntil)}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-white/60">Incoterm</div><div className="text-sm font-semibold">{quote.incoterm}</div></div>
          <div className="flex items-end justify-start lg:justify-end">
            <Button asChild size="sm" variant="secondary" className="gap-1.5">
              <Link to="/client/commandes/$reference" params={{ reference: quote.orderRef }}>
                <ExternalLink className="h-3.5 w-3.5" /> Voir la commande
              </Link>
            </Button>
          </div>
        </div>

        {/* Workflow visuel */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {WORKFLOW.map((label, i) => {
            const done = i < step;
            const current = i === step - 1 && quote.status !== "Accepté";
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium",
                  done ? "bg-white/20 text-white" : "bg-white/5 text-white/50",
                  current && "ring-2 ring-white/70",
                )}>
                  {label}
                </div>
                {i < WORKFLOW.length - 1 && <span className="text-white/40">→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bandeaux d'état */}
      {quote.status === "À valider" && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm">
          <span className="font-semibold">Action attendue :</span> consultez le devis puis acceptez-le (téléchargement, signature, import) ou refusez-le en précisant votre motif.{" "}
          <span className={cn("font-semibold", d <= 2 ? "text-destructive" : "text-warning")}>
            {d <= 0 ? "Le devis expire aujourd'hui." : `Expire dans ${d} jour${d > 1 ? "s" : ""}.`}
          </span>
        </div>
      )}
      {quote.status === "Expiré" && (
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
          Ce devis a expiré le {dateFR(quote.validUntil)}. L'acceptation n'est plus possible — vous pouvez demander un nouveau devis.
        </div>
      )}
      {quote.status === "Accepté" && (
        <div className="rounded-xl border border-success/40 bg-success/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <div className="flex items-center gap-2 font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" /> Devis accepté le {quote.audit.acceptedAt ? dateTimeFR(quote.audit.acceptedAt) : "—"}
              </div>
              <div className="mt-1 text-muted-foreground">
                Signataire : <span className="font-medium text-foreground">{quote.audit.acceptedBy}</span>
                {quote.audit.acceptedRole ? ` · ${quote.audit.acceptedRole}` : ""} · Document signé :{" "}
                <span className="font-medium text-foreground">{quote.audit.signedFile}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Commande {quote.orderRef} : <span className="line-through">En attente validation devis</span> → <span className="font-medium text-success">Devis accepté / préparation en cours</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast("Aperçu du devis signé", { description: quote.audit.signedFile })}>
                <Eye className="h-3.5 w-3.5" /> Voir le devis signé
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadQuotePdf(quote)}>
                <Download className="h-3.5 w-3.5" /> Télécharger
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/client/commandes/$reference" params={{ reference: quote.orderRef }}>Voir la commande</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
      {(quote.status === "Refusé" || quote.status === "Remplacé") && quote.audit.refusedAt && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <XCircle className="h-4 w-4" /> Devis refusé le {dateTimeFR(quote.audit.refusedAt)}
          </div>
          <div className="mt-1 text-muted-foreground">
            Motif : <span className="font-medium text-foreground">{quote.audit.refusalReason}</span> — « {quote.audit.refusalMessage} »
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Votre demande a été transmise à AKWA.</div>
        </div>
      )}
      {newer && (
        <div className="rounded-xl border border-ai/40 bg-ai/5 p-4 text-sm">
          <span className="font-semibold">Une version plus récente existe :</span> {newer.id} ({eur(quoteTotal(newer))}, {newer.status}).{" "}
          <Link to="/client/devis/$quoteId" params={{ quoteId: newer.id }} className="font-medium underline">Consulter la dernière version</Link>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {/* Aperçu du devis */}
          <Section title="Aperçu du devis" subtitle="Document officiel AKWA — consultation directe" icon={FileText}>
            <div className="rounded-xl border border-border bg-background p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <Logo />
                  <div className="mt-2 text-xs text-muted-foreground">
                    AKWA Export SA<br />
                    Zone Industrielle Ain Sebaâ, Casablanca, Maroc<br />
                    export@akwa.ma · +212 5 22 00 00 00<br />
                    ICE 002458796000045
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-lg font-bold">DEVIS</div>
                  <div className="mt-1 font-medium">{quote.id}</div>
                  <div className="text-muted-foreground">Commande {quote.orderRef}</div>
                  <div className="text-muted-foreground">Émis le {dateShort(quote.issuedAt)}</div>
                  <div className="text-muted-foreground">Valable jusqu'au {dateShort(quote.validUntil)}</div>
                </div>
              </div>

              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Client</div>
                  <div className="mt-1 text-sm font-semibold">{quote.client}</div>
                  <div className="text-xs text-muted-foreground">{quote.destination}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Devise" value={quote.currency} />
                  <Field label="Incoterm" value={quote.incoterm} />
                  <Field label="Destination" value={quote.destination} />
                  <Field label="Paiement" value={quote.paymentTerms} />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Référence</th>
                      <th className="px-3 py-2 text-left font-medium">Désignation</th>
                      <th className="px-3 py-2 text-right font-medium">Quantité</th>
                      <th className="px-3 py-2 text-left font-medium">Unité</th>
                      <th className="px-3 py-2 text-right font-medium">Prix unitaire</th>
                      <th className="px-3 py-2 text-right font-medium">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quote.items.map((i) => (
                      <tr key={i.ref}>
                        <td className="px-3 py-2 font-medium">{i.ref}</td>
                        <td className="px-3 py-2">{i.label}</td>
                        <td className="px-3 py-2 text-right">{new Intl.NumberFormat("fr-FR").format(i.quantity)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{i.unit}</td>
                        <td className="px-3 py-2 text-right">{eur2(i.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{eur(i.quantity * i.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          {/* Conditions commerciales */}
          <Section title="Conditions commerciales" subtitle="Modalités applicables à ce devis" icon={Ship}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Incoterm" value={quote.incoterm} />
              <Field label="Port de départ" value={quote.portDeparture} />
              <Field label="Port de destination" value={quote.portDestination} />
              <Field label="Conditions de paiement" value={quote.paymentTerms} />
              <Field label="Délai estimé de préparation" value={quote.preparationDelay} />
              <Field label="Date estimative d'expédition" value={dateFR(quote.etd)} />
              <Field label="Validité du devis" value={`${Math.max(1, Math.round((new Date(quote.validUntil).getTime() - new Date(quote.issuedAt).getTime()) / 86400000))} jours`} />
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-ai/30 bg-ai/5 p-3 text-xs">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai" />
              <span>{quote.notes}</span>
            </div>
          </Section>

          {/* Échanges */}
          <Section title="Échanges relatifs à ce devis" subtitle="Conversation avec l'équipe AKWA" icon={MessagesSquare}>
            <div className="space-y-3">
              {quote.messages.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun échange pour le moment. Posez votre question à l'équipe AKWA.</p>
              )}
              {quote.messages.map((m) => (
                <div key={m.id} className={cn("rounded-lg border p-3", m.org === "akwa" ? "border-primary/25 bg-primary/5" : "border-border bg-muted/30")}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold">
                      {m.org === "akwa" ? `${m.author} — AKWA` : `${m.author} — Client`}
                    </span>
                    <span className="text-muted-foreground">{dateTimeFR(m.at)}</span>
                  </div>
                  <p className="mt-1.5 text-sm">{m.text}</p>
                  {m.attachment && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" /> {m.attachment}
                    </div>
                  )}
                </div>
              ))}
              <div className="space-y-2 rounded-lg border border-border p-3">
                <Textarea rows={2} maxLength={1000} placeholder="Écrire un message à AKWA…" value={msg} onChange={(e) => setMsg(e.target.value)} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Input
                    className="max-w-[240px] text-xs"
                    placeholder="Nom de la pièce jointe (facultatif)"
                    value={attachment}
                    maxLength={80}
                    onChange={(e) => setAttachment(e.target.value)}
                  />
                  <Button size="sm" className="gap-1.5" disabled={msg.trim().length < 2} onClick={send}>
                    <Send className="h-3.5 w-3.5" /> Envoyer
                  </Button>
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          {/* Synthèse financière */}
          <Section title="Synthèse financière" subtitle="Détail du montant proposé" icon={Package}>
            <dl className="space-y-2 text-sm">
              {[
                ["Sous-total marchandises", goods],
                ["Frais de préparation", quote.charges.preparation],
                ["Frais logistiques", quote.charges.logistics],
                ["Fret maritime", quote.charges.freight],
                ["Assurance", quote.charges.insurance],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{label as string}</dt>
                  <dd className="font-medium">{eur(value as number)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <dt className="text-muted-foreground">Total HT</dt>
                <dd className="font-semibold">{eur(total)}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-xl bg-gradient-primary p-4 text-primary-foreground">
              <div className="text-[11px] uppercase tracking-wider text-white/70">Total du devis</div>
              <div className="text-3xl font-bold">{eur(total)}</div>
              <div className="text-xs text-white/70">{quote.currency} · {quote.incoterm}</div>
            </div>
          </Section>

          {/* Versions */}
          <Section
            title="Historique des versions"
            subtitle={`${versions.length} version${versions.length > 1 ? "s" : ""} pour ${quote.family}`}
            icon={GitCompareArrows}
            action={versions.length > 1 ? (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCompare(true)}>
                <GitCompareArrows className="h-3.5 w-3.5" /> Comparer les versions
              </Button>
            ) : undefined}
          >
            <div className="space-y-2">
              {versions.map((v) => (
                <Link
                  key={v.id}
                  to="/client/devis/$quoteId"
                  params={{ quoteId: v.id }}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border p-3 text-sm transition-smooth hover:bg-muted/40",
                    v.id === quote.id ? "border-primary/40 bg-primary/5" : "border-border",
                  )}
                >
                  <div>
                    <div className="font-semibold">V{v.version}</div>
                    <div className="text-xs text-muted-foreground">{dateShort(v.issuedAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{eur(quoteTotal(v))}</div>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", statusStyle[v.status])}>{v.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Section>

          {/* Timeline */}
          <Section title="Timeline du devis" subtitle="Suivi chronologique" icon={Clock}>
            <ol className="relative space-y-4 border-l border-border pl-4">
              {quote.timeline.map((e) => (
                <li key={e.id} className="relative">
                  <span className={cn(
                    "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full",
                    e.tone === "success" ? "bg-success" : e.tone === "danger" ? "bg-destructive" : e.tone === "warning" ? "bg-warning" : e.tone === "info" ? "bg-ai" : "bg-muted-foreground",
                  )} />
                  <div className="text-xs text-muted-foreground">{dateTimeFR(e.at)}</div>
                  <div className="text-sm font-medium">{e.label}</div>
                  {e.detail && <div className="text-xs text-muted-foreground">{e.detail}</div>}
                </li>
              ))}
            </ol>
          </Section>

          {/* Audit */}
          <Section title="Audit et traçabilité" subtitle="Historique complet du devis" icon={History}>
            <dl className="space-y-2 text-xs">
              {[
                ["Version du devis", `V${quote.version}`],
                ["Date d'envoi", quote.audit.sentAt ? dateTimeFR(quote.audit.sentAt) : "—"],
                ["Première consultation", quote.audit.firstViewedAt ? dateTimeFR(quote.audit.firstViewedAt) : "Non consulté"],
                ["Date de téléchargement", quote.audit.downloadedAt ? dateTimeFR(quote.audit.downloadedAt) : "—"],
                ["Date d'acceptation", quote.audit.acceptedAt ? dateTimeFR(quote.audit.acceptedAt) : "—"],
                ["Utilisateur ayant accepté", quote.audit.acceptedBy ?? "—"],
                ["Document signé", quote.audit.signedFile ?? "—"],
                ["Date du refus", quote.audit.refusedAt ? dateTimeFR(quote.audit.refusedAt) : "—"],
                ["Motif du refus", quote.audit.refusalReason ?? "—"],
                ["Message client", quote.audit.refusalMessage ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="max-w-[60%] text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Commande liée" subtitle="Devis rattaché à une commande export" icon={Building2}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{quote.orderRef}</div>
                <div className="text-xs text-muted-foreground">{quote.destination}</div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/client/commandes/$reference" params={{ reference: quote.orderRef }}>Voir la commande</Link>
              </Button>
            </div>
          </Section>
        </div>
      </div>

      <DecisionZone quote={quote} />

      <CompareDialog open={compare} onOpenChange={setCompare} versions={versions} />
    </div>
  );
}

function CompareDialog({ open, onOpenChange, versions }: { open: boolean; onOpenChange: (v: boolean) => void; versions: Quote[] }) {
  const a = versions[versions.length - 2];
  const b = versions[versions.length - 1];
  if (!a || !b) return null;

  const rows: { label: string; a: string; b: string; delta?: number }[] = [
    { label: "Total du devis", a: eur(quoteTotal(a)), b: eur(quoteTotal(b)), delta: quoteTotal(b) - quoteTotal(a) },
    { label: "Sous-total marchandises", a: eur(goodsTotal(a)), b: eur(goodsTotal(b)), delta: goodsTotal(b) - goodsTotal(a) },
    { label: "Fret maritime", a: eur(a.charges.freight), b: eur(b.charges.freight), delta: b.charges.freight - a.charges.freight },
    { label: "Frais logistiques", a: eur(a.charges.logistics), b: eur(b.charges.logistics), delta: b.charges.logistics - a.charges.logistics },
    { label: "Assurance", a: eur(a.charges.insurance), b: eur(b.charges.insurance), delta: b.charges.insurance - a.charges.insurance },
    { label: "Conditions de paiement", a: a.paymentTerms, b: b.paymentTerms },
    { label: "Délai de préparation", a: a.preparationDelay, b: b.preparationDelay },
    { label: "Validité", a: dateShort(a.validUntil), b: dateShort(b.validUntil) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparaison des versions — V{a.version} vs V{b.version}</DialogTitle>
          <DialogDescription>Visualisez rapidement ce qu'AKWA a modifié entre les deux propositions.</DialogDescription>
        </DialogHeader>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Élément</th>
              <th className="px-3 py-2 text-right font-medium">Version V{a.version}</th>
              <th className="px-3 py-2 text-right font-medium">Version V{b.version}</th>
              <th className="px-3 py-2 text-right font-medium">Différence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const changed = r.a !== r.b;
              return (
                <tr key={r.label} className={cn(changed && "bg-warning/5")}>
                  <td className="px-3 py-2 font-medium">{r.label}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{r.a}</td>
                  <td className={cn("px-3 py-2 text-right", changed && "font-semibold")}>{r.b}</td>
                  <td className={cn(
                    "px-3 py-2 text-right text-xs font-semibold",
                    r.delta === undefined ? "text-muted-foreground" : r.delta < 0 ? "text-success" : r.delta > 0 ? "text-destructive" : "text-muted-foreground",
                  )}>
                    {r.delta === undefined ? (changed ? "Modifié" : "Inchangé") : r.delta === 0 ? "—" : `${r.delta > 0 ? "+" : "−"}${eur(Math.abs(r.delta))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center gap-2 rounded-lg border border-ai/30 bg-ai/5 p-3 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-ai" />
          Les lignes surlignées correspondent aux éléments modifiés par AKWA dans la nouvelle version.
        </div>
      </DialogContent>
    </Dialog>
  );
}
