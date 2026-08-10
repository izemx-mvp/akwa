import { toast } from "sonner";
import {
  Wallet, Banknote, Coins, Weight, Boxes, Container, Layers, CalendarClock,
  AlertTriangle, Info, ShieldAlert, Gauge, ClipboardList, FileText, MessagesSquare, Ship, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard, KpiCard, MiniBar, Chip, Field, EmptyState } from "./shared";
import { cn } from "@/lib/utils";
import { eur, num, exportOrderStore, type Alert, type ExportOrder } from "@/lib/export-order-store";

const alertStyle: Record<Alert["level"], { cls: string; icon: typeof Info; tone: "info" | "warning" | "danger" }> = {
  Information: { cls: "border-ai/30 bg-ai/5", icon: Info, tone: "info" },
  Attention: { cls: "border-warning/40 bg-warning/5", icon: AlertTriangle, tone: "warning" },
  Urgent: { cls: "border-destructive/40 bg-destructive/5", icon: ShieldAlert, tone: "danger" },
};

export function TabOverview({ order, onGoTab }: { order: ExportOrder; onGoTab: (t: string) => void }) {
  const t = order.totals;
  const balance = t.total - t.paid;
  const pending = order.decisions.filter((d) => d.status === "En attente");

  return (
    <div className="space-y-4">
      {/* Alertes */}
      {order.alerts.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {order.alerts.map((a) => {
            const s = alertStyle[a.level];
            const Icon = s.icon;
            return (
              <div key={a.id} className={cn("flex items-start gap-3 rounded-xl border p-3.5", s.cls)}>
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", a.level === "Urgent" ? "bg-destructive/15 text-destructive" : a.level === "Attention" ? "bg-warning/20 text-warning" : "bg-ai/15 text-ai")}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{a.title}</span>
                    <Chip tone={s.tone}>{a.level}</Chip>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>
                </div>
                {a.action && (
                  <Button size="sm" variant="outline" onClick={() => onGoTab(a.action!.tab)}>{a.action.label}</Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <KpiCard label="Montant commande" value={eur(t.total)} icon={Wallet} />
        <KpiCard label="Montant payé" value={eur(t.paid)} sub={`${Math.round((t.paid / t.total) * 100)} % réglés`} icon={Banknote} tone="success" progress={(t.paid / t.total) * 100} />
        <KpiCard label="Solde restant" value={eur(balance)} sub="Avant embarquement" icon={Coins} tone="warning" />
        <KpiCard label="Poids total" value={`${num(order.weightKg)} kg`} icon={Weight} tone="info" />
        <KpiCard label="Volume" value={`${order.volumeM3} m³`} icon={Boxes} tone="info" />
        <KpiCard label="Conteneurs" value="2 × 40' HC" sub="Planifiés" icon={Container} />
        <KpiCard label="Articles" value={`${order.lines.length} réf.`} sub={`${num(order.lines.reduce((s, l) => s + l.qty, 0))} unités`} icon={Layers} />
        <KpiCard label="Expédition estimée" value="18 août 2026" sub={`ETA ${order.eta}`} icon={CalendarClock} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Résumé */}
        <SectionCard className="lg:col-span-2" title="Résumé de la commande" subtitle="Informations commerciales et logistiques" icon={ClipboardList}>
          <dl className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Référence AKWA" value={order.reference} strong />
            <Field label="Référence client" value={order.clientRef} />
            <Field label="Date commande" value="02/08/2026" />
            <Field label="Commercial AKWA" value={order.salesRep} />
            <Field label="Responsable export" value={order.exportManager} />
            <Field label="Pays destination" value={order.country} />
            <Field label="Port départ" value={order.portDeparture} />
            <Field label="Port destination" value={order.portArrival} />
            <Field label="Incoterm" value={order.incoterm} strong />
            <Field label="Mode de transport" value={order.transport} />
            <Field label="Devise" value={order.currency} />
            <Field label="Conditions de paiement" value={order.paymentTerms} />
            <Field label="Date estimée départ" value={order.etd} strong />
            <Field label="ETA" value={order.eta} strong />
            <Field label="Compagnie maritime" value={order.carrier} />
          </dl>
        </SectionCard>

        {/* Santé */}
        <SectionCard title="Santé de la commande" subtitle="Synthèse automatique" icon={Gauge}>
          <div className="flex items-center gap-4">
            <div
              className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
              style={{ background: `conic-gradient(var(--success) ${order.health.score * 3.6}deg, var(--muted) 0deg)` }}
            >
              <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-card">
                <span className="text-xl font-bold">{order.health.score}</span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Chip tone="success">Statut : {order.health.label}</Chip>
              <p className="text-xs text-muted-foreground">{order.health.summary}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {order.health.criteria.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs text-muted-foreground">{c.name}</span>
                <MiniBar pct={c.pct} tone={c.pct >= 95 ? "success" : c.pct >= 85 ? "info" : "warning"} />
                <span className="w-10 text-right text-xs font-semibold">{c.pct} %</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Décisions */}
      <SectionCard
        title="Décisions en attente"
        subtitle="Éléments qui nécessitent votre validation"
        icon={AlertTriangle}
        action={<Chip tone={pending.length ? "warning" : "success"}>{pending.length} en attente</Chip>}
      >
        {order.decisions.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Aucune décision en attente" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {order.decisions.map((d) => (
              <div key={d.id} className={cn("rounded-lg border p-3", d.status === "En attente" ? "border-warning/40 bg-warning/5" : "border-border")}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold">{d.title}</span>
                  <Chip tone={d.status === "Validée" ? "success" : d.status === "En attente" ? "warning" : "info"}>{d.status}</Chip>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>
                <div className="mt-2 text-[11px] font-medium text-warning">Échéance : {d.due}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => toast.info(d.description)}>Voir détails</Button>
                  <Button
                    size="sm"
                    disabled={d.status !== "En attente"}
                    onClick={() => {
                      exportOrderStore.resolveDecision(d.id, "Validée");
                      toast.success(d.id === "dec1" ? "Bill of Lading validé avec succès." : `${d.title} : validée.`);
                    }}
                  >
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={d.status !== "En attente"}
                    onClick={() => {
                      exportOrderStore.resolveDecision(d.id, "Modification demandée");
                      toast.success("Demande de modification transmise à AKWA.");
                    }}
                  >
                    Demander modification
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Prochaines étapes */}
        <SectionCard title="Prochaines étapes" subtitle="Jalons à venir" icon={CalendarClock}>
          <ol className="space-y-3">
            {order.timeline.filter((e) => e.state !== "done").slice(0, 4).map((e, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", e.state === "current" ? "bg-primary" : "bg-muted-foreground/40")} />
                <div>
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{e.date}{e.delay ? ` • ${e.delay}` : ""}</div>
                </div>
              </li>
            ))}
          </ol>
          <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => onGoTab("logistique")}>Voir le suivi complet</Button>
        </SectionCard>

        {/* Tracking rapide */}
        <SectionCard title="Tracking rapide" subtitle={order.shippingStatus} icon={Ship}>
          <dl className="grid grid-cols-2 gap-x-4">
            <Field label="Navire" value={order.vessel} strong />
            <Field label="Voyage" value={order.voyage} />
            <Field label="ETD" value={order.etd} />
            <Field label="ETA" value={order.eta} />
          </dl>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{order.city === "Abidjan" ? "Casablanca" : "Départ"}</span>
              <span>Abidjan</span>
            </div>
            <MiniBar pct={order.shippingStatus === "En transit" ? 48 : 4} tone="info" />
          </div>
          <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => onGoTab("logistique")}>Détail du transport</Button>
        </SectionCard>

        {/* Contacts + résumé financier */}
        <SectionCard title="Votre équipe AKWA" subtitle="Interlocuteurs dédiés" icon={Building2}>
          {[{ n: order.salesRep, r: "Responsable commerciale" }, { n: order.exportManager, r: "Responsable export" }].map((p) => (
            <div key={p.n} className="flex items-center gap-3 border-b border-dashed border-border/70 py-2 last:border-0">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {p.n.split(" ").map((x) => x[0]).slice(0, 2).join("")}
              </span>
              <div>
                <div className="text-sm font-medium">{p.n}</div>
                <div className="text-xs text-muted-foreground">{p.r}</div>
              </div>
            </div>
          ))}
          <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold">{eur(t.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Réglé</span><span className="text-success">{eur(t.paid)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Solde</span><span className="font-bold text-warning">{eur(balance)}</span></div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Derniers documents" icon={FileText} action={<Button size="sm" variant="ghost" onClick={() => onGoTab("documents")}>Tout voir</Button>}>
          <div className="space-y-2">
            {order.documents.slice(0, 4).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{d.reference}</div>
                </div>
                <Chip tone={d.status === "Disponible" ? "success" : d.status === "À valider" ? "info" : "warning"}>{d.status}</Chip>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Derniers messages" icon={MessagesSquare} action={<Button size="sm" variant="ghost" onClick={() => onGoTab("echanges")}>Ouvrir la messagerie</Button>}>
          <div className="space-y-2">
            {order.messages.slice(-3).map((m) => (
              <div key={m.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{m.author}</span>
                  <span>{m.at}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm">{m.text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
