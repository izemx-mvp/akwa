import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Activity,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  Workflow,
  Zap,
} from "lucide-react";
import { agents, type AgentId } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/agents/$agentId")({
  component: AgentDetail,
});

type Rule = { id: string; condition: string; action: string };
type Doc = { id: string; name: string; status: "Analysé" | "En cours"; insight: string };

const baseDocs: Record<AgentId, Doc[]> = {
  "pricing-advisor": [
    { id: "d1", name: "Politique pricing 2025.pdf", status: "Analysé", insight: "Marge cible huiles moteur = 16%" },
    { id: "d2", name: "Contrat Atlantic Trade.pdf", status: "Analysé", insight: "Client limité à +2% augmentation" },
  ],
  "container-optimizer": [
    { id: "d1", name: "Procédure chargement.pdf", status: "Analysé", insight: "Remplissage minimum interne = 85%" },
  ],
  "export-assistant": [
    { id: "d1", name: "Règles douanières Sénégal.pdf", status: "Analysé", insight: "Certificat d’origine obligatoire" },
    { id: "d2", name: "Code SH lubrifiants.pdf", status: "Analysé", insight: "Code 2710 requis" },
  ],
  "margin-analyst": [
    { id: "d1", name: "Politique marges 2025.pdf", status: "Analysé", insight: "Alerte si marge < 12%" },
  ],
  "internal-copilot": [
    { id: "d1", name: "Glossaire métier.pdf", status: "Analysé", insight: "Dictionnaire BC, devis, conteneur" },
  ],
  "order-assistant": [
    { id: "d1", name: "Catalogue produits.pdf", status: "Analysé", insight: "Compatibilités produits/conteneur" },
  ],
};

const baseRules: Record<AgentId, Rule[]> = {
  "pricing-advisor": [
    { id: "r1", condition: "marge < 12%", action: "proposer augmentation prix" },
    { id: "r2", condition: "client = Atlantic Trade", action: "ne pas dépasser +2% d’augmentation" },
  ],
  "container-optimizer": [
    { id: "r1", condition: "remplissage < 80%", action: "proposer ajustement quantité" },
    { id: "r2", condition: "produit = lubrifiant", action: "désactiver gerbage" },
  ],
  "export-assistant": [
    { id: "r1", condition: "document manquant", action: "bloquer validation" },
    { id: "r2", condition: "destination = Sénégal", action: "exiger certificat d’origine" },
  ],
  "margin-analyst": [
    { id: "r1", condition: "marge en baisse > 4%", action: "déclencher alerte rouge" },
  ],
  "internal-copilot": [
    { id: "r1", condition: "question sensible", action: "demander confirmation admin" },
  ],
  "order-assistant": [
    { id: "r1", condition: "remplissage < 60%", action: "suggérer +200 unités" },
  ],
};

function AgentDetail() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();
  const agent = agents.find((a) => a.id === agentId);

  const [active, setActive] = useState(true);
  const [knowledge, setKnowledge] = useState(
    "Client très sensible au prix. Produit difficile à empiler. Marché Sénégal très compétitif.",
  );
  const [docs, setDocs] = useState<Doc[]>(agent ? baseDocs[agent.id] ?? [] : []);
  const [rules, setRules] = useState<Rule[]>(agent ? baseRules[agent.id] ?? [] : []);
  const [newCond, setNewCond] = useState("");
  const [newAct, setNewAct] = useState("");
  const [simResult, setSimResult] = useState<string | null>(null);

  // Pricing params
  const [marginTarget, setMarginTarget] = useState([18]);
  const [marginMin, setMarginMin] = useState([10]);
  const [marginMax, setMarginMax] = useState([28]);
  const [strategy, setStrategy] = useState("equilibre");
  const [marketAware, setMarketAware] = useState(true);

  // Container params
  const [allowedContainers, setAllowedContainers] = useState({ "20": true, "40": true, "40hc": true });
  const [fillMin, setFillMin] = useState([85]);
  const [stacking, setStacking] = useState(true);
  const [palletPref, setPalletPref] = useState("europe");
  const [containerPriority, setContainerPriority] = useState("cout");

  // Export params
  const [activeCountries, setActiveCountries] = useState({
    "Sénégal": true,
    "Côte d'Ivoire": true,
    "Mauritanie": true,
    "Mali": false,
    "Guinée": false,
  });
  const [customsRules, setCustomsRules] = useState(true);
  const [validationRequired, setValidationRequired] = useState(true);
  const [slaDays, setSlaDays] = useState([3]);

  // Margin params
  const [marginAlert, setMarginAlert] = useState([12]);
  const [perfDrop, setPerfDrop] = useState([4]);
  const [alertSensitivity, setAlertSensitivity] = useState("modere");

  // Copilot params
  const [autonomy, setAutonomy] = useState("recommandation");
  const [recoLevel, setRecoLevel] = useState([2]);

  const dataSources = useMemo(
    () => ["Produits", "Clients", "Conteneurs", "Palettes", "Commandes"],
    [],
  );

  if (!agent) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Agent introuvable.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/admin/agents">Retour</Link></Button>
      </div>
    );
  }

  const Icon = agent.icon;

  const addRule = () => {
    if (!newCond.trim() || !newAct.trim()) return;
    setRules((r) => [...r, { id: `r${Date.now()}`, condition: newCond, action: newAct }]);
    setNewCond("");
    setNewAct("");
    toast.success("Règle ajoutée");
  };

  const removeRule = (id: string) => setRules((r) => r.filter((x) => x.id !== id));

  const fakeUpload = () => {
    const name = `Document-${docs.length + 1}.pdf`;
    setDocs((d) => [
      ...d,
      { id: `d${Date.now()}`, name, status: "En cours", insight: "Analyse IA en cours…" },
    ]);
    setTimeout(() => {
      setDocs((d) =>
        d.map((doc) =>
          doc.name === name ? { ...doc, status: "Analysé", insight: "Insight extrait : règle ajoutée" } : doc,
        ),
      );
      toast.success("Document analysé");
    }, 1500);
  };

  const runSimulation = () => {
    setSimResult(null);
    setTimeout(() => {
      const results: Record<AgentId, string> = {
        "pricing-advisor": `Sur commande test (Sénégal Fleet Lubricants, Huile moteur 5W-30 1L ×600) : marge actuelle 11.2%, recommandation +1.8% → marge cible ${marginTarget[0]}%.`,
        "container-optimizer": `Sur commande test (Atlantic Trade, 800 unités) : remplissage initial 68%, recommandation passage 40 pieds + gerbage → remplissage ${fillMin[0]}%+.`,
        "export-assistant": `Sur commande test Sénégal : 2 documents manquants détectés (certificat d’origine, code SH). Validation bloquée.`,
        "margin-analyst": `Analyse : 1 client sous le seuil ${marginAlert[0]}% (Dakar Energy). Alerte ${alertSensitivity} déclenchée.`,
        "internal-copilot": `Question test : "Meilleur client du mois ?" → Réponse : Dakar Auto Services (1.24M USD YTD, +2.1%).`,
        "order-assistant": `Panier test : remplissage 58%. Suggestion : +200 unités Huile 10W-40 5L pour atteindre 85%.`,
      };
      setSimResult(results[agent.id]);
      toast.success("Simulation exécutée");
    }, 900);
  };

  return (
    <div className="max-w-[1500px] space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/agents" })}>
          <ArrowLeft className="h-4 w-4" /> Retour aux agents
        </Button>
      </div>

      {/* 1. Vue générale */}
      <section className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="bg-gradient-ai p-6 text-ai-foreground flex items-start gap-5 flex-wrap">
          <div className="h-14 w-14 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur shrink-0">
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-[260px]">
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <p className="text-sm text-white/85 mt-1">{agent.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge className="bg-white/15 text-white">Rôle : {agent.role}</Badge>
              <Badge className={cn(active ? "bg-success/30 text-white" : "bg-white/10 text-white/70")}>
                <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", active ? "bg-success animate-pulse" : "bg-white/40")} />
                {active ? "Actif" : "En veille"}
              </Badge>
              <Badge className="bg-white/15 text-white">Confiance : 92%</Badge>
              <Badge className="bg-white/15 text-white">Dernière action : {agent.recentActions[0]}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm">{active ? "Activé" : "Désactivé"}</span>
          </div>
        </div>
      </section>

      <Tabs defaultValue="params" className="space-y-5">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="params"><Settings2 className="h-3.5 w-3.5" /> Paramètres métier</TabsTrigger>
          <TabsTrigger value="knowledge"><BookOpen className="h-3.5 w-3.5" /> Base de connaissance</TabsTrigger>
          <TabsTrigger value="rules"><Workflow className="h-3.5 w-3.5" /> Règles décisionnelles</TabsTrigger>
          <TabsTrigger value="data"><Brain className="h-3.5 w-3.5" /> Données utilisées</TabsTrigger>
          <TabsTrigger value="sim"><Zap className="h-3.5 w-3.5" /> Simulation</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="h-3.5 w-3.5" /> Activité</TabsTrigger>
        </TabsList>

        {/* 2. Paramètres métier */}
        <TabsContent value="params" className="space-y-5">
          <Section title="Paramètres métier" icon={Settings2}>
            {agent.id === "pricing-advisor" && (
              <div className="grid gap-5 md:grid-cols-2">
                <SliderField label="Marge cible" value={marginTarget} setValue={setMarginTarget} min={5} max={40} suffix="%" />
                <SliderField label="Marge minimale" value={marginMin} setValue={setMarginMin} min={0} max={25} suffix="%" />
                <SliderField label="Marge maximale" value={marginMax} setValue={setMarginMax} min={15} max={50} suffix="%" />
                <SelectField label="Stratégie" value={strategy} setValue={setStrategy} options={[
                  { value: "marge", label: "Maximiser la marge" },
                  { value: "volume", label: "Maximiser le volume" },
                  { value: "equilibre", label: "Équilibré" },
                ]} />
                <ToggleField label="Prise en compte du marché" checked={marketAware} onChange={setMarketAware} />
              </div>
            )}
            {agent.id === "container-optimizer" && (
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Conteneurs autorisés</Label>
                  <div className="space-y-2">
                    {(["20", "40", "40hc"] as const).map((c) => (
                      <ToggleField
                        key={c}
                        label={c === "20" ? "20 pieds" : c === "40" ? "40 pieds" : "40 pieds High Cube"}
                        checked={allowedContainers[c]}
                        onChange={(v) => setAllowedContainers((s) => ({ ...s, [c]: v }))}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <SliderField label="Seuil remplissage minimum" value={fillMin} setValue={setFillMin} min={50} max={99} suffix="%" />
                  <ToggleField label="Autoriser le gerbage" checked={stacking} onChange={setStacking} />
                  <SelectField label="Type de palettes préférées" value={palletPref} setValue={setPalletPref} options={[
                    { value: "europe", label: "Europe 120×80" },
                    { value: "industrielle", label: "Industrielle 100×120" },
                  ]} />
                  <SelectField label="Priorité" value={containerPriority} setValue={setContainerPriority} options={[
                    { value: "volume", label: "Volume" },
                    { value: "cout", label: "Coût" },
                    { value: "stabilite", label: "Stabilité" },
                  ]} />
                </div>
              </div>
            )}
            {agent.id === "export-assistant" && (
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Pays actifs</Label>
                  <div className="space-y-2">
                    {Object.keys(activeCountries).map((c) => (
                      <ToggleField
                        key={c}
                        label={c}
                        checked={(activeCountries as any)[c]}
                        onChange={(v) => setActiveCountries((s) => ({ ...s, [c]: v }))}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <ToggleField label="Règles douanières activées" checked={customsRules} onChange={setCustomsRules} />
                  <ToggleField label="Validation obligatoire" checked={validationRequired} onChange={setValidationRequired} />
                  <SliderField label="SLA documents" value={slaDays} setValue={setSlaDays} min={1} max={10} suffix=" jours" />
                </div>
              </div>
            )}
            {agent.id === "margin-analyst" && (
              <div className="grid gap-5 md:grid-cols-2">
                <SliderField label="Seuil alerte marge" value={marginAlert} setValue={setMarginAlert} min={5} max={25} suffix="%" />
                <SliderField label="Seuil baisse de performance" value={perfDrop} setValue={setPerfDrop} min={1} max={15} suffix="%" />
                <SelectField label="Niveau de sensibilité des alertes" value={alertSensitivity} setValue={setAlertSensitivity} options={[
                  { value: "faible", label: "Faible" },
                  { value: "modere", label: "Modéré" },
                  { value: "eleve", label: "Élevé" },
                ]} />
              </div>
            )}
            {(agent.id === "internal-copilot" || agent.id === "order-assistant") && (
              <div className="grid gap-5 md:grid-cols-2">
                <SelectField label="Niveau d’autonomie" value={autonomy} setValue={setAutonomy} options={[
                  { value: "lecture", label: "Lecture seule" },
                  { value: "recommandation", label: "Recommandations" },
                  { value: "action", label: "Actions automatiques" },
                ]} />
                <SliderField label="Niveau de recommandation" value={recoLevel} setValue={setRecoLevel} min={1} max={5} suffix="/5" />
                <div className="md:col-span-2">
                  <Label className="mb-2 block">Accès aux agents</Label>
                  <div className="flex flex-wrap gap-2">
                    {agents.filter((a) => a.id !== agent.id).map((a) => (
                      <Badge key={a.id} variant="secondary" className="text-xs">{a.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <Button onClick={() => toast.success("Paramètres enregistrés")}>Enregistrer les paramètres</Button>
            </div>
          </Section>
        </TabsContent>

        {/* 3. Base de connaissance */}
        <TabsContent value="knowledge" className="space-y-5">
          <Section title="A. Documents importés" icon={FileText}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-muted-foreground">Contrats, politiques, procédures — analysés automatiquement par l’IA.</p>
              <Button size="sm" onClick={fakeUpload}><Upload className="h-3.5 w-3.5" /> Importer un document</Button>
            </div>
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.insight}</div>
                    </div>
                  </div>
                  <Badge className={d.status === "Analysé" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
                    {d.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Section>

          <Section title="C. Connaissance contextuelle" icon={Brain}>
            <Label className="mb-2 block">Connaissance métier</Label>
            <Textarea value={knowledge} onChange={(e) => setKnowledge(e.target.value)} rows={5} />
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => toast.success("Connaissance enregistrée")}>Enregistrer</Button>
            </div>
          </Section>
        </TabsContent>

        {/* 4. Règles décisionnelles */}
        <TabsContent value="rules" className="space-y-5">
          <Section title="Règles SI / ALORS" icon={Workflow}>
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <Badge variant="secondary" className="text-[10px]">SI</Badge>
                  <span className="text-sm">{r.condition}</span>
                  <Badge variant="secondary" className="text-[10px] bg-ai/15 text-ai">ALORS</Badge>
                  <span className="text-sm flex-1">{r.action}</span>
                  <Button size="icon" variant="ghost" onClick={() => removeRule(r.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto] items-end">
              <div>
                <Label className="text-xs">SI (condition)</Label>
                <Input value={newCond} onChange={(e) => setNewCond(e.target.value)} placeholder="ex: marge < 12%" />
              </div>
              <div>
                <Label className="text-xs">ALORS (action)</Label>
                <Input value={newAct} onChange={(e) => setNewAct(e.target.value)} placeholder="ex: proposer +1.8%" />
              </div>
              <Button onClick={addRule}><Plus className="h-4 w-4" /> Ajouter</Button>
            </div>
          </Section>
        </TabsContent>

        {/* 5. Données utilisées */}
        <TabsContent value="data">
          <Section title="Données alimentant l’agent" icon={Brain}>
            <p className="text-sm text-muted-foreground mb-4">
              Ces données alimentent les décisions de l’agent.
            </p>
            <div className="grid gap-3 md:grid-cols-5">
              {dataSources.map((d) => (
                <div key={d} className="rounded-lg border border-border bg-background p-4 text-center">
                  <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />
                  <div className="text-sm font-medium">{d}</div>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* 6. Simulation */}
        <TabsContent value="sim">
          <Section title="Tester l’agent" icon={Zap}>
            <p className="text-sm text-muted-foreground mb-4">
              Lance une simulation sur une commande test pour observer le comportement de l’agent.
            </p>
            <div className="flex gap-2">
              <Button onClick={runSimulation} className="bg-gradient-ai text-ai-foreground">
                <Sparkles className="h-4 w-4" /> Lancer la simulation
              </Button>
            </div>
            {simResult && (
              <div className="mt-4 rounded-lg border border-ai/30 bg-ai/5 p-4">
                <div className="text-xs uppercase tracking-wider text-ai font-semibold mb-2">Résultat</div>
                <p className="text-sm">{simResult}</p>
              </div>
            )}
          </Section>
        </TabsContent>

        {/* 7. Activité */}
        <TabsContent value="activity">
          <Section title="Activité de l’agent" icon={Activity}>
            <div className="space-y-2">
              {[
                ...agent.recentActions.map((a) => ({ type: "Recommandation", text: a })),
                { type: "Action appliquée", text: "Pricing +1.8% appliqué sur AKW-2410-0182" },
                { type: "Anomalie", text: "Marge < 10% détectée sur Sénégal Fleet Lubricants" },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      log.type === "Anomalie" && "bg-destructive/15 text-destructive",
                      log.type === "Action appliquée" && "bg-success/15 text-success",
                    )}
                  >
                    {log.type}
                  </Badge>
                  <span className="text-sm flex-1">{log.text}</span>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Settings2;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h2>
      {children}
    </section>
  );
}

function SliderField({
  label,
  value,
  setValue,
  min,
  max,
  suffix = "",
}: {
  label: string;
  value: number[];
  setValue: (v: number[]) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <Label>{label}</Label>
        <strong>{value[0]}{suffix}</strong>
      </div>
      <Slider value={value} onValueChange={setValue} min={min} max={max} step={1} />
    </div>
  );
}

function SelectField({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
