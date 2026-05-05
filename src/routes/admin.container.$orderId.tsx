import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AgentBadge } from "@/components/AgentBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  Package,
  Rotate3D,
  Ship,
  Sparkles,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clients, products } from "@/lib/mock-data";
import { ordersStore } from "@/lib/orders-store";

export const Route = createFileRoute("/admin/container/$orderId")({
  component: ContainerDetail,
});

type ViewMode = "isométrique" | "dessus" | "latérale";

const containers = [
  { id: "20", name: "20 pieds", volume: 33, weight: 28000 },
  { id: "40", name: "40 pieds", volume: 67, weight: 26500 },
  { id: "40hc", name: "40 pieds High Cube", volume: 76, weight: 26500 },
];

const palletColors = ["bg-primary", "bg-ai", "bg-success", "bg-warning"];
const palletFillColors = ["bg-primary/80", "bg-ai/80", "bg-success/80", "bg-warning/80"];

function useOrders() {
  return useSyncExternalStore(
    (cb) => ordersStore.subscribe(cb),
    () => ordersStore.getAll(),
    () => ordersStore.getAll(),
  );
}

function ContainerDetail() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const orders = useOrders();
  const order = orders.find((o) => o.id === orderId);

  const [palletType, setPalletType] = useState<"europe" | "industrielle">("europe");
  const [stacking, setStacking] = useState(true);
  const [maxHeightCm, setMaxHeightCm] = useState([180]);
  const [maxWeightKg, setMaxWeightKg] = useState([1000]);
  const [viewMode, setViewMode] = useState<ViewMode>("isométrique");
  const [zoom, setZoom] = useState([72]);
  const [selectedScenario, setSelectedScenario] = useState(1);
  const [appliedScenario, setAppliedScenario] = useState<number | null>(null);

  const totals = useMemo(() => {
    if (!order) return { volume: 0, weight: 0, qty: 0 };
    return order.lines.reduce(
      (acc, l) => {
        const p = products.find((x) => x.id === l.productId);
        return {
          volume: acc.volume + (p?.unitVolumeM3 ?? 0) * l.quantity,
          weight: acc.weight + (p?.unitWeightKg ?? 0) * l.quantity,
          qty: acc.qty + l.quantity,
        };
      },
      { volume: 0, weight: 0, qty: 0 },
    );
  }, [order]);

  if (!order) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Commande introuvable.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/admin/container">Retour</Link></Button>
      </div>
    );
  }

  const client = clients.find((c) => c.id === order.clientId);
  const palletFootprint = palletType === "europe" ? 1.2 * 0.8 : 1.0 * 1.2;
  const palletVolume = palletFootprint * 1.2;
  const basePallets = Math.max(4, Math.ceil(totals.volume / palletVolume));

  const scenarios = [
    {
      id: 0,
      title: "Basique",
      description: "Configuration actuelle, conteneur 20 pieds, palettes standard.",
      container: containers[0],
      pallets: basePallets,
      stacking: false,
      fill: 65,
      cost: "8 200 €",
      unit: "6,80 €/u",
      tag: "—",
    },
    {
      id: 1,
      title: "Conteneur adapté",
      description: "Passage à un 40 pieds : remplissage et coût unitaire optimisés.",
      container: containers[1],
      pallets: Math.ceil(basePallets * 0.9),
      stacking: false,
      fill: 90,
      cost: "9 400 €",
      unit: "5,40 €/u",
      tag: "RECOMMANDÉ",
    },
    {
      id: 2,
      title: "Optimisation palettes",
      description: "Palettes Europe et meilleure disposition pour densifier le chargement.",
      container: containers[1],
      pallets: Math.ceil(basePallets * 0.85),
      stacking: false,
      fill: 88,
      cost: "9 100 €",
      unit: "5,55 €/u",
      tag: "—",
    },
    {
      id: 3,
      title: "Gerbage activé",
      description: "Empilage des palettes pour gagner ~12% d’espace utile.",
      container: containers[1],
      pallets: Math.ceil(basePallets * 0.7),
      stacking: true,
      fill: 95,
      cost: "9 200 €",
      unit: "5,10 €/u",
      tag: "—",
    },
    {
      id: 4,
      title: "Ajustement quantités",
      description: "Augmenter légèrement les quantités pour saturer le conteneur.",
      container: containers[1],
      pallets: Math.ceil(basePallets * 1.05),
      stacking: true,
      fill: 98,
      cost: "9 750 €",
      unit: "4,80 €/u",
      tag: "—",
    },
  ];

  const scenario = scenarios[selectedScenario];

  const apply = () => {
    setAppliedScenario(selectedScenario);
    toast.success(`Scénario "${scenario.title}" appliqué à la commande ${order.reference}`);
  };

  return (
    <div className="max-w-[1500px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/container" })}>
            <ArrowLeft className="h-4 w-4" /> Retour à la liste
          </Button>
          <div className="mt-2">
            <AgentBadge name="Agent d’Optimisation des Conteneurs" icon={Package} />
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Optimisation — {order.reference}</h1>
          <p className="text-sm text-muted-foreground">
            Optimisation pour une seule commande (un seul client). Aucun regroupement.
          </p>
        </div>
        {appliedScenario !== null && (
          <Badge className="bg-success/15 text-success">Appliqué : {scenarios[appliedScenario].title}</Badge>
        )}
      </div>

      {/* A. Infos commande */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-semibold mb-4">A. Informations commande</h2>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="space-y-2 text-sm">
            <Row label="Client" value={client?.name ?? "—"} />
            <Row label="Destination" value={order.destination} />
            <Row label="Volume total" value={`${totals.volume.toFixed(2)} m³`} />
            <Row label="Poids total" value={`${totals.weight.toLocaleString("fr-FR")} kg`} />
            <Row label="Quantité totale" value={`${totals.qty.toLocaleString("fr-FR")} unités`} />
          </div>
          <div className="rounded-lg border border-border bg-background overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Produit</th>
                  <th className="text-right px-3 py-2 font-medium">Qté</th>
                  <th className="text-right px-3 py-2 font-medium">Vol. unit.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.lines.map((l, i) => {
                  const p = products.find((x) => x.id === l.productId);
                  return (
                    <tr key={i}>
                      <td className="px-3 py-2 flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", palletColors[i % palletColors.length])} />
                        {p?.name ?? l.productId}
                      </td>
                      <td className="px-3 py-2 text-right">{l.quantity}</td>
                      <td className="px-3 py-2 text-right">{p?.unitVolumeM3} m³</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* B. Analyse IA */}
      <section className="grid gap-5 md:grid-cols-4">
        <Metric label="Volume total" value={`${totals.volume.toFixed(1)} m³`} />
        <Metric label="Poids total" value={`${totals.weight.toLocaleString("fr-FR")} kg`} />
        <Metric label="Palettes estimées" value={String(basePallets)} />
        <Metric label="Remplissage initial" value="65 %" />
      </section>

      {/* C + D + E */}
      <section className="grid gap-6 xl:grid-cols-[330px_1fr]">
        <div className="space-y-6">
          {/* C - Choix conteneur */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-semibold mb-4">C. Choix du conteneur (IA)</h2>
            <div className="rounded-lg border border-primary bg-primary/5 p-3 mb-3">
              <div className="flex items-center justify-between">
                <strong>Recommandé : {scenario.container.name}</strong>
                <Ship className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cap. volume {scenario.container.volume} m³ · Cap. poids {scenario.container.weight.toLocaleString("fr-FR")} kg · Occ. {scenario.fill}%
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              {containers.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-2",
                    c.id === scenario.container.id ? "border-primary bg-primary/5" : "border-border bg-background",
                  )}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.volume} m³</span>
                </div>
              ))}
            </div>
          </div>

          {/* D - Configuration palettes */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-semibold mb-4">D. Configuration palettes</h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <Button size="sm" variant={palletType === "europe" ? "default" : "outline"} onClick={() => setPalletType("europe")}>Europe 120×80</Button>
                <Button size="sm" variant={palletType === "industrielle" ? "default" : "outline"} onClick={() => setPalletType("industrielle")}>Industrielle 100×120</Button>
              </div>
              <Metric label="Nombre de palettes" value={String(scenario.pallets)} />
              <ToggleRow label="Gerbage activé" checked={stacking} onCheckedChange={setStacking} />
              <div>
                <div className="mb-2 flex justify-between"><span>Hauteur max</span><strong>{maxHeightCm[0]} cm</strong></div>
                <Slider value={maxHeightCm} onValueChange={setMaxHeightCm} min={120} max={240} step={5} />
              </div>
              <div>
                <div className="mb-2 flex justify-between"><span>Poids max / palette</span><strong>{maxWeightKg[0]} kg</strong></div>
                <Slider value={maxWeightKg} onValueChange={setMaxWeightKg} min={400} max={1500} step={50} />
              </div>
            </div>
          </div>
        </div>

        {/* E - 3D */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">E. Visualisation 3D du chargement</h2>
              <p className="text-xs text-muted-foreground">Conteneur ouvert · palettes par produit · zones vides</p>
            </div>
            <div className="flex gap-2">
              {(["isométrique", "dessus", "latérale"] as ViewMode[]).map((m) => (
                <Button key={m} size="sm" variant={viewMode === m ? "default" : "outline"} onClick={() => setViewMode(m)}>{m}</Button>
              ))}
            </div>
          </div>
          <Container3D fill={scenario.fill} pallets={scenario.pallets} viewMode={viewMode} zoom={zoom[0]} stacking={scenario.stacking} />
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Rotate3D className="h-4 w-4" /> Rotation simulée · <ZoomIn className="h-4 w-4" /> Zoom {zoom[0]}%
            </div>
            <Slider value={zoom} onValueChange={setZoom} min={50} max={100} step={1} />
          </div>
        </div>
      </section>

      {/* F - Scénarios */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-semibold mb-4">F. Scénarios d’optimisation</h2>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className={cn(
                "rounded-lg border p-4 cursor-pointer transition-smooth",
                selectedScenario === s.id ? "border-ai bg-ai/5" : "border-border bg-background hover:border-primary",
              )}
              onClick={() => setSelectedScenario(s.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Scénario {s.id + 1} — {s.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                </div>
                {s.tag === "RECOMMANDÉ" && <Badge className="bg-ai text-ai-foreground text-[10px]">RECOMMANDÉ</Badge>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Metric compact label="Remplissage" value={`${s.fill}%`} />
                <Metric compact label="Coût total" value={s.cost} />
                <Metric compact label="Coût unit." value={s.unit} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedScenario(s.id); apply(); }}>Appliquer</Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedScenario(s.id); }}>
                  <Eye className="h-3.5 w-3.5" /> Voir en 3D
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* G + H */}
      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-ai" /> G. Suggestions IA</h2>
          <div className="space-y-2 text-sm">
            {[
              "Changer vers un conteneur 40 pieds pour optimiser l’espace",
              "Utiliser des palettes Europe 120×80 pour une meilleure répartition",
              "Activer le gerbage pour gagner environ 12% d’espace",
              "Réorganiser les palettes pour améliorer le remplissage",
              "Ajuster certaines quantités pour éviter les zones vides",
            ].map((s) => (
              <div key={s} className="flex items-start gap-2 rounded-lg border border-border bg-background p-3">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-xl bg-gradient-ai p-5 text-ai-foreground shadow-ai">
          <AgentBadge name="H. Recommandation de l’agent" icon={Sparkles} />
          <h2 className="mt-3 text-xl font-bold">Scénario optimal</h2>
          <p className="text-sm text-white/85 mt-2">
            Utiliser un conteneur <strong>40 pieds</strong> avec palettes <strong>Europe</strong> et gerbage activé.
            Cela permet d’atteindre un taux de remplissage de <strong>93%</strong> et de réduire le coût unitaire de <strong>14%</strong>.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white/10 p-3"><div className="text-white/70">Remplissage</div><strong>93%</strong></div>
            <div className="rounded-lg bg-white/10 p-3"><div className="text-white/70">Coût logistique</div><strong>9 200 €</strong></div>
            <div className="rounded-lg bg-white/10 p-3"><div className="text-white/70">Coût unitaire</div><strong>5,10 €</strong></div>
            <div className="rounded-lg bg-white/10 p-3"><div className="text-white/70">Gain</div><strong>-14%</strong></div>
          </div>
          <div className="mt-4 grid gap-2">
            <Button variant="secondary" onClick={() => { setSelectedScenario(3); apply(); }}>Appliquer ce scénario</Button>
            <Button variant="outline" className="border-white/30 bg-white/10 text-ai-foreground hover:bg-white/20" onClick={() => setSelectedScenario(3)}>
              Voir en 3D
            </Button>
          </div>
        </aside>
      </section>

      {/* I + J - Actions */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-wrap gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate({ to: "/admin/order-details/$orderId", params: { orderId: order.id } })}>
          <ArrowLeft className="h-4 w-4" /> Retour commande
        </Button>
        <Button variant="outline" onClick={() => toast.success("Plan de chargement exporté")}>
          <Download className="h-4 w-4" /> Exporter le plan
        </Button>
        <Button onClick={apply}><CheckCircle2 className="h-4 w-4" /> Appliquer ce scénario</Button>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-border bg-background p-3", compact && "p-2")}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (c: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background p-2 border border-border">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function Container3D({ fill, pallets, viewMode, zoom, stacking }: { fill: number; pallets: number; viewMode: ViewMode; zoom: number; stacking: boolean }) {
  const filled = Math.round((fill / 100) * 30);
  return (
    <div className="mt-5 h-[420px] overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background via-secondary to-muted p-6">
      <div className="relative mx-auto h-full max-w-4xl" style={{ transform: `scale(${zoom / 82})`, transformOrigin: "center" }}>
        <div className={cn(
          "absolute left-1/2 top-1/2 h-64 w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-primary/50 bg-background/45 shadow-elegant",
          viewMode === "isométrique" && "rotate-[-8deg] skew-x-[-12deg]",
          viewMode === "latérale" && "h-48",
          viewMode === "dessus" && "h-72",
        )}>
          <div className="absolute -left-5 top-6 h-52 w-8 skew-y-[35deg] border border-primary/35 bg-primary/10" />
          <div className="absolute -top-5 left-4 h-8 w-[585px] skew-x-[48deg] border border-primary/35 bg-primary/10" />
          <div className="absolute inset-4 grid grid-cols-10 grid-rows-3 gap-2">
            {Array.from({ length: 30 }).map((_, i) => {
              const isFilled = i < filled;
              const colorIndex = i % palletFillColors.length;
              return (
                <div
                  key={i}
                  className={cn(
                    "relative rounded-sm border",
                    isFilled
                      ? `${palletFillColors[colorIndex]} border-foreground/30 shadow-sm`
                      : "border-dashed border-muted-foreground/40 bg-white",
                  )}
                  title={isFilled ? `Palette ${i + 1}` : "Zone vide"}
                >
                  {isFilled && stacking && i % 4 === 0 && (
                    <div className="absolute -top-3 left-1 right-1 h-3 rounded-t-sm bg-foreground/30" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-3 right-3 rounded-lg border border-border bg-card/95 p-2 text-xs shadow-card">
            <span className="text-muted-foreground">Zones vides</span>
            <strong className="ml-2 text-warning">{100 - fill}%</strong>
          </div>
          <div className="absolute bottom-3 left-3 rounded-lg border border-border bg-card/95 p-2 text-xs shadow-card">
            <span className="text-muted-foreground">Palettes</span>
            <strong className="ml-2">{pallets}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
