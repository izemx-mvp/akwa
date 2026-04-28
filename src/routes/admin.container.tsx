import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AgentBadge } from "@/components/AgentBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Layers3,
  Package,
  Rotate3D,
  Ship,
  Sparkles,
  Truck,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/container")({
  component: ContainerAgent,
});

type AgentStatus = "Actif" | "Analyse en cours" | "Optimisé";
type ViewMode = "isométrique" | "dessus" | "latérale";

const orders = [
  { id: "CMD-2408", city: "Casablanca", destination: "Dakar", product: "Bouteille Butane 12kg", quantity: 820, volume: 34.8, weight: 9840, color: "bg-primary" },
  { id: "CMD-2411", city: "Mohammedia", destination: "Dakar", product: "Pack Lubrifiant XL", quantity: 420, volume: 18.2, weight: 3780, color: "bg-ai" },
  { id: "CMD-2417", city: "Agadir", destination: "Nouakchott", product: "Fût Additif Carburant", quantity: 160, volume: 12.6, weight: 5120, color: "bg-success" },
];

const scenarios = [
  { id: 0, title: "Conteneur actuel", fill: 72, cost: "8 900 €", unit: "6,35 €/unité", margin: "-3,4 %", risk: "Faible", container: "20 pieds", pallets: 18 },
  { id: 1, title: "Regroupement commandes", fill: 94, cost: "10 700 €", unit: "4,88 €/unité", margin: "+2,1 %", risk: "Faible", container: "40 pieds", pallets: 26 },
  { id: 2, title: "Ajout commande future", fill: 98, cost: "11 250 €", unit: "4,62 €/unité", margin: "+3,8 %", risk: "Modéré", container: "40 pieds HC", pallets: 30 },
  { id: 3, title: "Changement conteneur", fill: 86, cost: "9 850 €", unit: "5,12 €/unité", margin: "+0,9 %", risk: "Faible", container: "40 pieds", pallets: 24 },
];

const suggestions = [
  "Ajouter 120 unités Bouteille Butane 12kg pour compléter le conteneur",
  "Regrouper avec une commande d’une autre ville à destination Dakar",
  "Séparer les palettes lubrifiants pour améliorer le placement",
  "Activer le gerbage pour gagner 12 % d’espace",
  "Utiliser un conteneur 40 pieds au lieu de 20 pieds",
];

function ContainerAgent() {
  const [status, setStatus] = useState<AgentStatus>("Actif");
  const [selectedOrders, setSelectedOrders] = useState(["CMD-2408", "CMD-2411"]);
  const [selectedScenario, setSelectedScenario] = useState(1);
  const [fillRate, setFillRate] = useState(94);
  const [gain, setGain] = useState(18);
  const [loadingStep, setLoadingStep] = useState("");
  const [analyzed, setAnalyzed] = useState(true);
  const [stacking, setStacking] = useState(true);
  const [mixOrders, setMixOrders] = useState(true);
  const [anticipation, setAnticipation] = useState(true);
  const [minFill, setMinFill] = useState([88]);
  const [optimization, setOptimization] = useState("agressif");
  const [viewMode, setViewMode] = useState<ViewMode>("isométrique");
  const [zoom, setZoom] = useState([72]);
  const [activity, setActivity] = useState([
    "Scénario recommandé : regroupement commandes",
    "Simulation exécutée sur conteneur 40 pieds",
    "Analyse effectuée sur 2 commandes",
  ]);

  const activeOrders = orders.filter((order) => selectedOrders.includes(order.id));
  const scenario = scenarios[selectedScenario];
  const totals = useMemo(
    () => ({
      volume: activeOrders.reduce((sum, order) => sum + order.volume, 0),
      weight: activeOrders.reduce((sum, order) => sum + order.weight, 0),
      quantity: activeOrders.reduce((sum, order) => sum + order.quantity, 0),
      pallets: Math.ceil(activeOrders.reduce((sum, order) => sum + order.volume, 0) / 2.1) + (stacking ? -3 : 2),
    }),
    [activeOrders, stacking],
  );

  const runTimedAgent = (steps: string[], done: () => void) => {
    setStatus("Analyse en cours");
    steps.forEach((step, index) => {
      window.setTimeout(() => setLoadingStep(step), index * 650);
    });
    window.setTimeout(() => {
      setLoadingStep("");
      setStatus("Optimisé");
      done();
    }, steps.length * 650 + 450);
  };

  const analyzeOrders = () => {
    runTimedAgent(["Analyse des volumes…", "Calcul des poids…", "Détection des contraintes…", "Choix du conteneur optimal…"], () => {
      setAnalyzed(true);
      setActivity((items) => ["Analyse effectuée : 2 commandes compatibles détectées", ...items]);
      toast.success("Analyse des commandes terminée");
    });
  };

  const optimizeLoading = () => {
    runTimedAgent(["Analyse des volumes…", "Optimisation du placement…", "Simulation des scénarios…", "Génération du plan palettes…"], () => {
      setSelectedScenario(2);
      setFillRate(96);
      setGain(22);
      setActivity((items) => ["Optimisation réalisée : remplissage porté à 96 %", "Scénario recommandé généré", ...items]);
      toast.success("Chargement optimisé par l’agent IA");
    });
  };

  const applyScenario = (id = selectedScenario) => {
    const next = scenarios[id];
    setSelectedScenario(id);
    setFillRate(id === 2 ? 96 : next.fill);
    setGain(id === 2 ? 22 : 18);
    setStatus("Optimisé");
    setActivity((items) => [`Scénario appliqué : ${next.title}`, ...items]);
    toast.success("Scénario appliqué avec succès");
  };

  const exportPlan = () => {
    setActivity((items) => ["Plan de chargement exporté avec visualisation 3D", ...items]);
    toast.success("Plan de chargement exporté");
  };

  return (
    <div className="max-w-[1500px] space-y-6">
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <AgentBadge name="Agent d’Optimisation des Conteneurs" icon={Package} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Agent d’Optimisation des Conteneurs</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Agent IA logistique pour analyser les commandes, choisir le bon conteneur, optimiser les palettes et recommander la meilleure stratégie d’expédition.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">Statut : {status}</span>
              <span className="rounded-full bg-success/10 px-3 py-1 font-medium text-success">Taux de remplissage : {fillRate} %</span>
              <span className="rounded-full bg-ai/10 px-3 py-1 font-medium text-ai">Gain estimé : +{gain} %</span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Agent actif</span>
              <span className={cn("rounded-full px-2 py-1 text-[11px]", status === "Analyse en cours" ? "bg-warning/10 text-warning" : "bg-success/10 text-success")}>{status}</span>
            </div>
            <Progress value={fillRate} className="mt-4" />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Suggestions impact" value="5" />
              <Metric label="Palettes estimées" value={String(totals.pallets)} />
              <Metric label="Économie coût" value="-15 %" />
              <Metric label="Confiance IA" value="91 %" />
            </div>
            {loadingStep && <div className="mt-4 rounded-lg bg-ai/10 px-3 py-2 text-sm font-medium text-ai animate-pulse">{loadingStep}</div>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Commandes sélectionnées</h2>
            <Button size="sm" variant="outline" onClick={analyzeOrders} disabled={status === "Analyse en cours"}>Analyser les commandes</Button>
          </div>
          <div className="mt-4 grid gap-3">
            {orders.map((order) => {
              const selected = selectedOrders.includes(order.id);
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrders((items) => (selected ? items.filter((item) => item !== order.id) : [...items, order.id]))}
                  className={cn("grid gap-3 rounded-lg border p-4 text-left transition-smooth md:grid-cols-[1fr_110px_110px]", selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary")}
                >
                  <div>
                    <div className="flex items-center gap-2 font-semibold"><span className={cn("h-2.5 w-2.5 rounded-full", order.color)} />{order.id} — {order.product}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{order.city} → {order.destination} · {order.quantity} unités</div>
                  </div>
                  <Metric label="Volume" value={`${order.volume} m³`} compact />
                  <Metric label="Poids" value={`${order.weight.toLocaleString("fr-FR")} kg`} compact />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold">Analyse IA</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Volume total" value={`${totals.volume.toFixed(1)} m³`} />
            <Metric label="Poids total" value={`${totals.weight.toLocaleString("fr-FR")} kg`} />
            <Metric label="Palettes estimées" value={`${totals.pallets}`} />
            <Metric label="Quantité totale" value={`${totals.quantity.toLocaleString("fr-FR")}`} />
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {analyzed && ["Compatibilité destination Dakar détectée", "Poids sous limite pour 40 pieds", "Gerbage recommandé sur lubrifiants", "Zone vide exploitable côté porte"].map((item) => (
              <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[330px_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Choix du conteneur</h2>
            <div className="mt-4 rounded-lg border border-primary bg-primary/5 p-4">
              <div className="flex items-center justify-between"><strong>Recommandé : {scenario.container}</strong><Ship className="h-5 w-5 text-primary" /></div>
              <div className="mt-3 text-sm text-muted-foreground">Capacité adaptée au mix commandes avec remplissage estimé à {fillRate} %.</div>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <ContainerOption label="20 pieds" value="72 %" />
              <ContainerOption label="40 pieds" value="94 %" active />
              <ContainerOption label="40 pieds HC" value="98 %" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Configuration palettes</h2>
            <div className="mt-4 space-y-4 text-sm">
              <Metric label="Nombre de palettes" value={String(scenario.pallets)} />
              <Metric label="Type palettes" value="Europe 120 × 80" />
              <ToggleRow label="Gerbage activé" checked={stacking} onCheckedChange={setStacking} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Visualisation 3D du plan de chargement</h2>
              <p className="text-xs text-muted-foreground">Conteneur ouvert, palettes par produit, empilage et zones vides.</p>
            </div>
            <div className="flex gap-2">
              {(["isométrique", "dessus", "latérale"] as ViewMode[]).map((mode) => (
                <Button key={mode} size="sm" variant={viewMode === mode ? "default" : "outline"} onClick={() => setViewMode(mode)}>{mode}</Button>
              ))}
            </div>
          </div>
          <Container3D fill={fillRate} pallets={scenario.pallets} viewMode={viewMode} zoom={zoom[0]} stacking={stacking} />
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="flex items-center gap-3 text-sm text-muted-foreground"><Rotate3D className="h-4 w-4" />Rotation simulée · <ZoomIn className="h-4 w-4" />Zoom {zoom[0]} %</div>
            <Slider value={zoom} onValueChange={setZoom} min={50} max={100} step={1} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Optimisation IA & scénarios</h2>
              <p className="text-xs text-muted-foreground">Comparaison du coût total, coût unitaire, marge impactée et risque.</p>
            </div>
            <Button className="bg-gradient-ai shadow-ai" onClick={optimizeLoading} disabled={status === "Analyse en cours"}><Sparkles className="h-4 w-4" /> Optimiser le chargement</Button>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {scenarios.map((item) => (
              <div key={item.id} className={cn("rounded-lg border p-4", selectedScenario === item.id ? "border-ai bg-ai/5" : "border-border bg-background")}> 
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-semibold">Scénario {item.id + 1} — {item.title}</h3><p className="text-xs text-muted-foreground">{item.container} · {item.pallets} palettes</p></div>
                  <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">{item.fill} %</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Metric label="Coût total" value={item.cost} compact />
                  <Metric label="Coût unitaire" value={item.unit} compact />
                  <Metric label="Marge" value={item.margin} compact />
                  <Metric label="Risque" value={item.risk} compact />
                </div>
                <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => applyScenario(item.id)}>Appliquer</Button><Button size="sm" variant="outline" onClick={() => setSelectedScenario(item.id)}><Eye className="h-4 w-4" /> Voir en 3D</Button></div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-xl bg-gradient-ai p-5 text-ai-foreground shadow-ai">
          <AgentBadge name="Recommandation de l’agent IA" icon={Sparkles} />
          <h2 className="mt-4 text-xl font-bold">Scénario recommandé : Regroupement + ajout partiel</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white/10 p-3"><div className="text-white/70">Taux remplissage</div><strong>96 %</strong></div>
            <div className="rounded-lg bg-white/10 p-3"><div className="text-white/70">Gain logistique</div><strong>+22 %</strong></div>
            <div className="rounded-lg bg-white/10 p-3"><div className="text-white/70">Coût unitaire</div><strong>-15 %</strong></div>
            <div className="rounded-lg bg-white/10 p-3"><div className="text-white/70">Marge</div><strong>-1,2 %</strong></div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-white/85">
            {[
              "Le conteneur actuel est sous-utilisé.",
              "Le regroupement avec une commande existante améliore le remplissage.",
              "L’ajout partiel d’une commande future permet d’atteindre une optimisation maximale.",
              "L’impact sur la marge reste acceptable (-1,2 %).",
            ].map((text) => <p key={text}>• {text}</p>)}
          </div>
          <p className="mt-4 rounded-lg bg-white/15 p-3 text-sm font-semibold">Ce scénario maximise l’utilisation du conteneur tout en maintenant une rentabilité optimale.</p>
          <div className="mt-4 grid gap-2"><Button variant="secondary" onClick={() => applyScenario(2)}>Appliquer ce scénario</Button><Button variant="outline" className="border-white/30 bg-white/10 text-ai-foreground hover:bg-white/20" onClick={() => setSelectedScenario(2)}>Voir en 3D</Button><Button variant="outline" className="border-white/30 bg-white/10 text-ai-foreground hover:bg-white/20">Ajuster le scénario</Button></div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel title="Suggestions IA" icon={Sparkles} className="xl:col-span-1">
          <div className="space-y-2">{suggestions.map((item) => <div key={item} className="rounded-lg border border-border bg-background p-3 text-sm">{item}</div>)}</div>
        </Panel>
        <Panel title="Anticipation des commandes" icon={Clock3}>
          <div className="rounded-lg bg-primary/5 p-4 text-sm"><strong>Une commande similaire est prévue dans 2 jours.</strong><p className="mt-2 text-muted-foreground">Recommandé d’attendre et regrouper pour optimiser le transport.</p></div>
        </Panel>
        <Panel title="Export" icon={Download}>
          <p className="text-sm text-muted-foreground">Inclut le plan 3D, la répartition palettes, le conteneur recommandé et les zones vides.</p>
          <Button className="mt-4 w-full" onClick={exportPlan}><Download className="h-4 w-4" /> Exporter le plan de chargement</Button>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Configuration agent" icon={Layers3}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <ToggleRow label="Activer gerbage" checked={stacking} onCheckedChange={setStacking} />
              <ToggleRow label="Autoriser mélange commandes" checked={mixOrders} onCheckedChange={setMixOrders} />
              <ToggleRow label="Autoriser anticipation" checked={anticipation} onCheckedChange={setAnticipation} />
            </div>
            <div className="space-y-4">
              <div><div className="mb-2 flex justify-between text-sm"><span>Seuil remplissage minimum</span><strong>{minFill[0]} %</strong></div><Slider value={minFill} onValueChange={setMinFill} min={70} max={98} step={1} /></div>
              <div className="flex flex-wrap gap-2">{["conservateur", "modéré", "agressif"].map((item) => <Button key={item} size="sm" variant={optimization === item ? "default" : "outline"} onClick={() => setOptimization(item)}>{item}</Button>)}</div>
            </div>
          </div>
        </Panel>
        <Panel title="Activité agent" icon={Activity}>
          <div className="space-y-3">{activity.map((item, index) => <div key={`${item}-${index}`} className="flex gap-3 text-sm"><ArrowUpRight className="mt-0.5 h-4 w-4 text-primary" /><span>{item}</span></div>)}</div>
        </Panel>
      </section>
    </div>
  );
}

function Container3D({ fill, pallets, viewMode, zoom, stacking }: { fill: number; pallets: number; viewMode: ViewMode; zoom: number; stacking: boolean }) {
  const filled = Math.round((fill / 100) * pallets);
  return (
    <div className="mt-5 h-[430px] overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background via-secondary to-muted p-6">
      <div className="relative mx-auto h-full max-w-4xl" style={{ transform: `scale(${zoom / 82})`, transformOrigin: "center" }}>
        <div className={cn("absolute left-1/2 top-1/2 h-64 w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-primary/50 bg-background/45 shadow-elegant", viewMode === "isométrique" && "rotate-[-8deg] skew-x-[-12deg]", viewMode === "latérale" && "h-48", viewMode === "dessus" && "h-72")}> 
          <div className="absolute -left-5 top-6 h-52 w-8 skew-y-[35deg] border border-primary/35 bg-primary/10" />
          <div className="absolute -top-5 left-4 h-8 w-[585px] skew-x-[48deg] border border-primary/35 bg-primary/10" />
          <div className="absolute inset-4 grid grid-cols-10 grid-rows-3 gap-2">
            {Array.from({ length: 30 }).map((_, index) => {
              const isFilled = index < filled;
              return (
                <div key={index} className={cn("relative rounded-sm border", isFilled ? (index % 3 === 0 ? "border-primary/50 bg-primary/80" : index % 3 === 1 ? "border-ai/50 bg-ai/80" : "border-success/50 bg-success/80") : "border-dashed border-muted-foreground/25 bg-background/40")}> 
                  {isFilled && stacking && index % 4 === 0 && <div className="absolute -top-3 left-1 right-1 h-3 rounded-t-sm bg-foreground/20" />}
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-3 right-3 rounded-lg border border-border bg-card/95 p-3 text-sm shadow-card"><span className="text-muted-foreground">Zones vides</span><strong className="ml-2 text-warning">{100 - fill} %</strong></div>
        </div>
        <div className="absolute bottom-2 left-2 flex gap-3 text-xs"><Legend color="bg-primary" label="Butane" /><Legend color="bg-ai" label="Lubrifiants" /><Legend color="bg-success" label="Additifs" /><Legend color="bg-background border border-dashed border-muted-foreground" label="Vide" /></div>
      </div>
    </div>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return <div className={cn("rounded-lg bg-background p-3", compact && "p-2")}><div className="text-[11px] text-muted-foreground">{label}</div><div className="font-semibold text-foreground">{value}</div></div>;
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-lg bg-background p-3 text-sm"><span>{label}</span><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}

function ContainerOption({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return <div className={cn("flex items-center justify-between rounded-lg border p-3", active ? "border-primary bg-primary/5" : "border-border bg-background")}><span>{label}</span><strong>{value}</strong></div>;
}

function Panel({ title, icon: Icon, children, className }: { title: string; icon: typeof Package; children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-border bg-card p-5 shadow-card", className)}><h2 className="mb-4 flex items-center gap-2 font-semibold"><Icon className="h-5 w-5 text-primary" />{title}</h2>{children}</section>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5 rounded-full bg-card/90 px-2 py-1"><span className={cn("h-2.5 w-2.5 rounded-full", color)} />{label}</span>;
}