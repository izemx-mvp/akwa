import { useState } from "react";
import { toast } from "sonner";
import { Filter, RotateCcw, Save, Download, FileBarChart, ChevronDown, Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  analyticsStore, useAnalyticsState, PERIODS, COMPARES, ALL, rangeOf, downloadCsv,
  type Filters,
} from "@/lib/analytics-store";
import { boStore } from "@/lib/backoffice-store";
import { cn } from "@/lib/utils";

function Select({ label, value, options, onChange, className }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; className?: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 min-w-[110px] max-w-[190px] truncate rounded-md border border-border bg-background px-2 text-xs outline-none transition-smooth focus:ring-2 focus:ring-primary/40"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

const opt = (values: string[]) => [{ value: ALL, label: ALL }, ...values.map((v) => ({ value: v, label: v }))];

export function FilterBar({ onReport, exportRows }: { onReport: () => void; exportRows: () => Record<string, string | number>[] }) {
  const { filters: f, views } = useAnalyticsState();
  const { clients, products, suppliers, orders } = boStore.get();
  const [more, setMore] = useState(false);
  const [viewName, setViewName] = useState("");
  const range = rangeOf(f);

  const set = (patch: Partial<Filters>) => analyticsStore.setFilters(patch);
  const countries = [...new Set(clients.map((c) => c.country))].sort();
  const zones = [...new Set(Object.values({ ...clients.reduce((a, c) => ({ ...a, [c.country]: c.country }), {}) }))];
  const categories = [...new Set(products.map((p) => p.category))].sort();
  const commercials = [...new Set(clients.map((c) => c.manager))];
  const exportManagers = [...new Set(orders.map((o) => o.exportManager))];
  const statuses = [...new Set(orders.map((o) => o.status))];
  const incoterms = [...new Set(clients.map((c) => c.incoterm))].sort();
  const transports = [...new Set(clients.map((c) => c.transport))];
  const ports = [...new Set(clients.map((c) => c.city))].sort();

  const activeCount = (Object.keys(f) as (keyof Filters)[]).filter(
    (k) => !["period", "from", "to", "compare", "currency"].includes(k) && f[k] !== ALL,
  ).length;

  return (
    <div className="sticky top-0 z-30 -mx-1 rounded-xl border border-border bg-card/95 px-3 py-2.5 shadow-card backdrop-blur">
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Période" value={f.period} options={PERIODS.map((p) => ({ value: p.key, label: p.label }))} onChange={(v) => set({ period: v as Filters["period"] })} />
        {f.period === "custom" && (
          <>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Du</span>
              <Input type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} className="h-8 w-[135px] text-xs" />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Au</span>
              <Input type="date" value={f.to} onChange={(e) => set({ to: e.target.value })} className="h-8 w-[135px] text-xs" />
            </label>
          </>
        )}
        <Select label="Comparaison" value={f.compare} options={COMPARES.map((c) => ({ value: c.key, label: c.label }))} onChange={(v) => set({ compare: v as Filters["compare"] })} />
        <Select label="Client" value={f.clientId} options={[{ value: ALL, label: "Tous" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} onChange={(v) => set({ clientId: v })} />
        <Select label="Pays" value={f.country} options={opt(countries)} onChange={(v) => set({ country: v })} />
        <Select label="Catégorie" value={f.category} options={opt(categories)} onChange={(v) => set({ category: v })} />

        <div className="ml-auto flex items-end gap-1.5">
          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => setMore((m) => !m)}>
            <Filter className="h-3.5 w-3.5" /> Filtres avancés
            {activeCount > 0 && <span className="rounded bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">{activeCount}</span>}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", more && "rotate-180")} />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs"><Bookmark className="h-3.5 w-3.5" /> Vues</Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <p className="mb-2 text-xs font-semibold">Vues enregistrées</p>
              <div className="space-y-1">
                {views.map((v) => (
                  <div key={v.id} className="flex items-center gap-1">
                    <button
                      className="flex-1 truncate rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
                      onClick={() => { analyticsStore.applyView(v.id); toast.success(`Vue « ${v.name} » appliquée`); }}
                    >
                      {v.name}
                    </button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => analyticsStore.deleteView(v.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                {views.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Aucune vue enregistrée.</p>}
              </div>
              <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
                <Input value={viewName} onChange={(e) => setViewName(e.target.value)} placeholder="Nom de la vue" className="h-8 text-xs" />
                <Button
                  size="sm" className="h-8"
                  onClick={() => {
                    if (!viewName.trim()) return toast.error("Donnez un nom à la vue.");
                    analyticsStore.saveView(viewName.trim());
                    toast.success(`Vue « ${viewName.trim()} » enregistrée`);
                    setViewName("");
                  }}
                >
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => { analyticsStore.reset(); toast.info("Filtres réinitialisés"); }}>
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
          </Button>
          <Button
            size="sm" variant="outline" className="h-8 gap-1 text-xs"
            onClick={() => { downloadCsv(`akwa-analytics-${range.from}_${range.to}`, exportRows()); toast.success("Export CSV généré"); }}
          >
            <Download className="h-3.5 w-3.5" /> Exporter
          </Button>
          <Button size="sm" className="h-8 gap-1 bg-gradient-primary text-xs shadow-elegant" onClick={onReport}>
            <FileBarChart className="h-3.5 w-3.5" /> Générer un rapport
          </Button>
        </div>
      </div>

      {more && (
        <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-border pt-2">
          <Select label="Zone" value={f.zone} options={opt(["Afrique de l'Ouest", "Afrique centrale", "Afrique du Nord-Ouest"])} onChange={(v) => set({ zone: v })} />
          <Select label="Produit" value={f.productRef} options={[{ value: ALL, label: "Tous" }, ...products.slice(0, 40).map((p) => ({ value: p.ref, label: p.name }))]} onChange={(v) => set({ productRef: v })} />
          <Select label="Fournisseur" value={f.supplierId} options={[{ value: ALL, label: "Tous" }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]} onChange={(v) => set({ supplierId: v })} />
          <Select label="Commercial" value={f.commercial} options={opt(commercials)} onChange={(v) => set({ commercial: v })} />
          <Select label="Resp. export" value={f.exportManager} options={opt(exportManagers)} onChange={(v) => set({ exportManager: v })} />
          <Select label="Statut commande" value={f.orderStatus} options={opt(statuses)} onChange={(v) => set({ orderStatus: v })} />
          <Select label="Statut devis" value={f.quoteStatus} options={opt(["Accepté", "Refusé", "Expiré", "En attente"])} onChange={(v) => set({ quoteStatus: v })} />
          <Select label="Devise" value={f.currency} options={[{ value: "EUR", label: "EUR" }]} onChange={(v) => set({ currency: v })} />
          <Select label="Port destination" value={f.port} options={opt(ports)} onChange={(v) => set({ port: v })} />
          <Select label="Incoterm" value={f.incoterm} options={opt(incoterms)} onChange={(v) => set({ incoterm: v })} />
          <Select label="Transport" value={f.transport} options={opt(transports)} onChange={(v) => set({ transport: v })} />
          <span className="ml-auto self-center text-[11px] text-muted-foreground">
            {zones.length} pays couverts · période {range.label}
          </span>
        </div>
      )}
    </div>
  );
}
