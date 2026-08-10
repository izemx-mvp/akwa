import { toast } from "sonner";
import { Ship, GitCommitVertical, PackageCheck, ShieldCheck, CircleDot, Circle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard, Chip, MiniBar, Field } from "./shared";
import { cn } from "@/lib/utils";
import { exportOrderStore, type ExportOrder } from "@/lib/export-order-store";

export function LogisticsTimeline({ order }: { order: ExportOrder }) {
  return (
    <SectionCard title="Suivi logistique" subtitle="Jalons de la commande export" icon={GitCommitVertical}>
      <ol className="relative space-y-4 border-l border-border pl-6">
        {order.timeline.map((e, i) => (
          <li key={`${e.title}-${i}`} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full border-2 border-card",
                e.state === "done" && "bg-success text-success-foreground",
                e.state === "current" && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                e.state === "planned" && "bg-muted text-muted-foreground",
              )}
            >
              {e.state === "done" ? <Check className="h-3 w-3" /> : e.state === "current" ? <CircleDot className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
            </span>
            <div className={cn("rounded-lg border p-3", e.state === "current" ? "border-primary/30 bg-primary/5" : "border-transparent")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{e.date}</span>
                <span className={cn("text-sm font-semibold", e.state === "planned" && "text-muted-foreground")}>{e.title}</span>
                {e.state === "current" && <Chip tone="primary">En cours</Chip>}
                {e.delay && <Chip tone="warning">{e.delay}</Chip>}
              </div>
              {e.detail && <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

export function ReadinessCard({ order }: { order: ExportOrder }) {
  const split = [
    { label: "Produits disponibles", pct: 78, tone: "success" },
    { label: "Produits en préparation", pct: 17, tone: "warning" },
    { label: "Produits en attente fournisseur", pct: 5, tone: "danger" },
  ];
  return (
    <SectionCard title="Préparation et disponibilité" subtitle="État des marchandises en entrepôt" icon={PackageCheck}>
      <div className="space-y-3">
        {split.map((s) => (
          <div key={s.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-semibold">{s.pct} %</span>
            </div>
            <MiniBar pct={s.pct} tone={s.tone} />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        {order.familyReadiness.map((f) => (
          <div key={f.name} className="flex items-center gap-3">
            <span className="w-52 shrink-0 truncate text-xs">{f.name}</span>
            <MiniBar pct={f.pct} tone={f.pct === 100 ? "success" : f.pct >= 80 ? "info" : "warning"} />
            <span className="w-12 text-right text-xs font-semibold">{f.pct} %</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Consolidation prévue</div>
          <div className="text-sm font-semibold">{order.consolidationDate}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Chargement prévu</div>
          <div className="text-sm font-semibold">{order.loadingDate}</div>
        </div>
      </div>
    </SectionCard>
  );
}

export function ShippingCard({ order }: { order: ExportOrder }) {
  const inTransit = order.shippingStatus === "En transit";
  return (
    <SectionCard
      title="Transport maritime"
      subtitle={`${order.carrier} • ${order.vessel}`}
      icon={Ship}
      action={<Chip tone={inTransit ? "success" : "info"}>{order.shippingStatus}</Chip>}
    >
      <dl className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Compagnie" value={order.carrier} />
        <Field label="Navire" value={order.vessel} strong />
        <Field label="Voyage" value={order.voyage} />
        <Field label="Port de départ" value={order.portDeparture} />
        <Field label="Port d'arrivée" value={order.portArrival} />
        <Field label="Transit estimé" value={`${order.transitDays} jours`} />
        <Field label="ETD" value={order.etd} strong />
        <Field label="ETA" value={order.eta} strong />
        <Field label="Scellé conteneur" value={order.sealNumber ?? "Non attribué"} />
      </dl>

      <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex items-center justify-between text-xs font-medium">
          <span>Casablanca</span>
          <span className="text-muted-foreground">Océan Atlantique</span>
          <span>Abidjan</span>
        </div>
        <div className="relative mt-3 h-2 rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-ai transition-all duration-700" style={{ width: inTransit ? "48%" : "0%" }} />
          <span
            className="absolute -top-2 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full border border-border bg-card shadow-card transition-all duration-700"
            style={{ left: inTransit ? "48%" : "0%" }}
          >
            <Ship className="h-3 w-3 text-primary" />
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {inTransit
            ? "Navire en mer — position actualisée quotidiennement."
            : "Le suivi de position s'activera dès l'embarquement effectif."}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        <span>Emplacement réservé à la future intégration API de tracking maritime (CMA CGM / AIS).</span>
        {!inTransit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              exportOrderStore.markShipped();
              toast.success("Expédition confirmée — suivi maritime activé.");
            }}
          >
            Simuler l'embarquement
          </Button>
        )}
      </div>
    </SectionCard>
  );
}

export function QualityCard({ order }: { order: ExportOrder }) {
  const tone = { "Validé": "success", "En cours": "warning", "À venir": "neutral" } as const;
  return (
    <SectionCard title="Qualité et conformité" subtitle="Contrôles avant embarquement" icon={ShieldCheck}>
      <div className="grid gap-2 sm:grid-cols-2">
        {order.quality.map((q) => (
          <div key={q.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <span className="text-sm">{q.name}</span>
            <Chip tone={tone[q.state]}>{q.state}</Chip>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 rounded-lg border border-border bg-muted/20 p-3">
        {order.checklist.map((c) => (
          <li key={c.label} className={cn("flex items-center gap-2 text-sm", !c.done && "text-muted-foreground")}>
            <span className={cn("grid h-4 w-4 place-items-center rounded-full border", c.done ? "border-success bg-success text-success-foreground" : "border-border")}>
              {c.done && <Check className="h-2.5 w-2.5" />}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-lg border border-border p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Numéro du scellé</div>
        <div className="text-sm font-semibold">{order.sealNumber ?? "Sera communiqué après chargement"}</div>
      </div>
    </SectionCard>
  );
}
