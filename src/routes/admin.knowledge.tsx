import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Upload, Search, Database, Package, Box, Layers, Bot, AlertTriangle, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/knowledge")({
  component: KnowledgePage,
});

// ---------- Types ----------
type PriceHistory = { date: string; prix: number; cout: number; marche: number };
type Produit = {
  id: string;
  nom: string;
  reference: string;
  categorie: string;
  type: string;
  prix: number;
  cout: number;
  prixMarche: number;
  conditionnement: string;
  volume: number; // L
  poids: number; // kg
  empilable: boolean;
  fragile: boolean;
  contraintes: string;
  majDate: string;
  historique: PriceHistory[];
};
type Conteneur = {
  id: string;
  type: string;
  longueur: number;
  largeur: number;
  hauteur: number;
  volume: number;
  poidsMax: number;
  variante: "standard" | "high cube";
  produitsAdaptes: string;
  contraintes: string;
  coutMoyen: number;
};
type Palette = {
  id: string;
  type: string;
  longueur: number;
  largeur: number;
  chargeMax: number;
  hauteurMax: number;
  empilable: boolean;
  produitsCompatibles: string;
  nbColisMax: number;
  gerbage: boolean;
};

// ---------- Mock data ----------
const initialProduits: Produit[] = [
  {
    id: "p1",
    nom: "Lubrifiant moteur 20L",
    reference: "LUB-20L-001",
    categorie: "Lubrifiants",
    type: "Huile industrielle",
    prix: 118,
    cout: 85,
    prixMarche: 122,
    conditionnement: "Bidon 20L",
    volume: 20,
    poids: 18,
    empilable: true,
    fragile: false,
    contraintes: "Tenir à l'abri de la chaleur",
    majDate: "2026-04-28",
    historique: [
      { date: "2026-01", prix: 110, cout: 80, marche: 115 },
      { date: "2026-02", prix: 112, cout: 82, marche: 118 },
      { date: "2026-03", prix: 115, cout: 83, marche: 120 },
      { date: "2026-04", prix: 118, cout: 85, marche: 122 },
    ],
  },
  {
    id: "p2",
    nom: "Huile industrielle 200L",
    reference: "HUI-200L-002",
    categorie: "Lubrifiants",
    type: "Huile industrielle",
    prix: 980,
    cout: 720,
    prixMarche: 1010,
    conditionnement: "Fût 200L",
    volume: 200,
    poids: 180,
    empilable: false,
    fragile: false,
    contraintes: "Manutention chariot obligatoire",
    majDate: "2026-04-25",
    historique: [
      { date: "2026-01", prix: 940, cout: 700, marche: 980 },
      { date: "2026-02", prix: 950, cout: 705, marche: 990 },
      { date: "2026-03", prix: 970, cout: 715, marche: 1000 },
      { date: "2026-04", prix: 980, cout: 720, marche: 1010 },
    ],
  },
  {
    id: "p3",
    nom: "Additif carburant",
    reference: "ADD-5L-003",
    categorie: "Additifs",
    type: "Additif",
    prix: 42,
    cout: 28,
    prixMarche: 45,
    conditionnement: "Bidon 5L",
    volume: 5,
    poids: 5,
    empilable: true,
    fragile: false,
    contraintes: "Inflammable - classe 3",
    majDate: "2026-04-20",
    historique: [
      { date: "2026-01", prix: 38, cout: 26, marche: 40 },
      { date: "2026-02", prix: 39, cout: 27, marche: 42 },
      { date: "2026-03", prix: 40, cout: 27, marche: 43 },
      { date: "2026-04", prix: 42, cout: 28, marche: 45 },
    ],
  },
  {
    id: "p4",
    nom: "Huile hydraulique",
    reference: "HYD-20L-004",
    categorie: "Lubrifiants",
    type: "Huile hydraulique",
    prix: 135,
    cout: 95,
    prixMarche: 140,
    conditionnement: "Bidon 20L",
    volume: 20,
    poids: 19,
    empilable: true,
    fragile: false,
    contraintes: "Stockage température < 40°C",
    majDate: "2026-04-30",
    historique: [
      { date: "2026-01", prix: 128, cout: 90, marche: 132 },
      { date: "2026-02", prix: 130, cout: 92, marche: 135 },
      { date: "2026-03", prix: 132, cout: 94, marche: 138 },
      { date: "2026-04", prix: 135, cout: 95, marche: 140 },
    ],
  },
];

const initialConteneurs: Conteneur[] = [
  {
    id: "c1",
    type: "Conteneur 20 pieds",
    longueur: 6.06,
    largeur: 2.44,
    hauteur: 2.59,
    volume: 33,
    poidsMax: 28000,
    variante: "standard",
    produitsAdaptes: "Lubrifiants, fûts, bidons",
    contraintes: "Charge max 28t, gerbage limité",
    coutMoyen: 2200,
  },
  {
    id: "c2",
    type: "Conteneur 40 pieds",
    longueur: 12.19,
    largeur: 2.44,
    hauteur: 2.59,
    volume: 67,
    poidsMax: 30480,
    variante: "standard",
    produitsAdaptes: "Marchandises volumineuses légères",
    contraintes: "Charge max 30t",
    coutMoyen: 3400,
  },
  {
    id: "c3",
    type: "Conteneur 40 pieds High Cube",
    longueur: 12.19,
    largeur: 2.44,
    hauteur: 2.89,
    volume: 76,
    poidsMax: 30480,
    variante: "high cube",
    produitsAdaptes: "Volumes encombrants, palettes hautes",
    contraintes: "Hauteur supplémentaire",
    coutMoyen: 3700,
  },
];

const initialPalettes: Palette[] = [
  {
    id: "pl1",
    type: "Palette Europe (EUR)",
    longueur: 120,
    largeur: 80,
    chargeMax: 1000,
    hauteurMax: 180,
    empilable: true,
    produitsCompatibles: "Bidons, cartons standards",
    nbColisMax: 32,
    gerbage: true,
  },
  {
    id: "pl2",
    type: "Palette industrielle",
    longueur: 120,
    largeur: 100,
    chargeMax: 1500,
    hauteurMax: 200,
    empilable: true,
    produitsCompatibles: "Fûts 200L, charges lourdes",
    nbColisMax: 4,
    gerbage: false,
  },
];

// ---------- Composant ----------
function KnowledgePage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> Base de Connaissance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Référentiel central des produits, conteneurs et palettes — alimente tous les agents IA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Bot className="h-3 w-3" /> Connecté aux agents IA
          </Badge>
        </div>
      </header>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <span>
            Ces données sont utilisées par les agents <strong>Pricing</strong>,{" "}
            <strong>Optimisation Conteneur</strong> et <strong>Export</strong>. Toute modification
            est tracée dans l'historique.
          </span>
        </CardContent>
      </Card>

      <Tabs defaultValue="produits">
        <TabsList>
          <TabsTrigger value="produits" className="gap-2">
            <Package className="h-4 w-4" /> Produits
          </TabsTrigger>
          <TabsTrigger value="conteneurs" className="gap-2">
            <Box className="h-4 w-4" /> Conteneurs
          </TabsTrigger>
          <TabsTrigger value="palettes" className="gap-2">
            <Layers className="h-4 w-4" /> Palettes
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" /> Clients & Informations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produits" className="mt-4">
          <ProduitsModule />
        </TabsContent>
        <TabsContent value="conteneurs" className="mt-4">
          <ConteneursModule />
        </TabsContent>
        <TabsContent value="palettes" className="mt-4">
          <PalettesModule />
        </TabsContent>
        <TabsContent value="clients" className="mt-4">
          <ClientsModule />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Import dialog ----------
function ImportDialog({ label, open, onOpenChange }: { label: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import en masse — {label}</DialogTitle>
          <DialogDescription>
            Formats acceptés : Excel (.xlsx) et CSV. Champs attendus : nom, référence, prix, coût, volume, poids.
          </DialogDescription>
        </DialogHeader>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
          <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
          Glissez-déposez votre fichier ici
          <div className="mt-3">
            <Button size="sm" onClick={() => { toast.success(`${label} importés avec succès`); onOpenChange(false); }}>
              Sélectionner un fichier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Produits ----------
function ProduitsModule() {
  const [produits] = useState<Produit[]>(initialProduits);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Produit | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(
    () => produits.filter((p) => `${p.nom} ${p.reference} ${p.categorie}`.toLowerCase().includes(q.toLowerCase())),
    [produits, q],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle>Produits</CardTitle>
          <CardDescription>Catalogue produits avec prix, coûts et marges.</CardDescription>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher..." className="pl-8 w-64" />
          </div>
          <Button onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" /> Importer des produits
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom produit</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Prix actuel</TableHead>
              <TableHead className="text-right">Coût</TableHead>
              <TableHead className="text-right">Prix marché</TableHead>
              <TableHead className="text-right">Marge</TableHead>
              <TableHead>Maj</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const marge = ((p.prix - p.cout) / p.prix) * 100;
              return (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                  <TableCell className="font-medium">{p.nom}</TableCell>
                  <TableCell className="text-muted-foreground">{p.reference}</TableCell>
                  <TableCell>{p.categorie}</TableCell>
                  <TableCell className="text-right">{p.prix} €</TableCell>
                  <TableCell className="text-right">{p.cout} €</TableCell>
                  <TableCell className="text-right">{p.prixMarche} €</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={marge < 15 ? "destructive" : "secondary"}>{marge.toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.majDate}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <ProduitDetail produit={selected} onClose={() => setSelected(null)} />
      <ImportDialog label="Produits" open={importOpen} onOpenChange={setImportOpen} />
    </Card>
  );
}

function ProduitDetail({ produit, onClose }: { produit: Produit | null; onClose: () => void }) {
  if (!produit) return null;
  const marge = ((produit.prix - produit.cout) / produit.prix) * 100;
  const maxVal = Math.max(...produit.historique.flatMap((h) => [h.prix, h.cout, h.marche]));

  return (
    <Sheet open={!!produit} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{produit.nom}</SheetTitle>
          <SheetDescription>{produit.reference} — {produit.categorie}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Section title="Informations générales">
            <Field label="Nom" value={produit.nom} />
            <Field label="Référence" value={produit.reference} />
            <Field label="Catégorie" value={produit.categorie} />
            <Field label="Type" value={produit.type} />
          </Section>

          <Section title="Données financières">
            <Field label="Coût produit" value={`${produit.cout} €`} />
            <Field label="Prix actuel" value={`${produit.prix} €`} />
            <Field label="Prix marché" value={`${produit.prixMarche} €`} />
            <Field label="Marge actuelle" value={`${marge.toFixed(1)} %`} />
          </Section>

          <Section title="Historique des prix">
            <div className="col-span-2 space-y-2">
              <div className="flex gap-4 text-xs text-muted-foreground">
                <LegendDot color="bg-primary" label="Prix" />
                <LegendDot color="bg-amber-500" label="Coût" />
                <LegendDot color="bg-emerald-500" label="Marché" />
              </div>
              <div className="grid grid-cols-4 gap-3 h-40 items-end">
                {produit.historique.map((h) => (
                  <div key={h.date} className="flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 h-32 w-full justify-center">
                      <div className="bg-primary w-3 rounded-t" style={{ height: `${(h.prix / maxVal) * 100}%` }} />
                      <div className="bg-amber-500 w-3 rounded-t" style={{ height: `${(h.cout / maxVal) * 100}%` }} />
                      <div className="bg-emerald-500 w-3 rounded-t" style={{ height: `${(h.marche / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Conditionnement">
            <Field label="Conditionnement" value={produit.conditionnement} />
            <Field label="Volume unitaire" value={`${produit.volume} L`} />
            <Field label="Poids unitaire" value={`${produit.poids} kg`} />
          </Section>

          <Section title="Logistique">
            <Field label="Empilable" value={produit.empilable ? "Oui" : "Non"} />
            <Field label="Fragile" value={produit.fragile ? "Oui" : "Non"} />
            <Field label="Contraintes" value={produit.contraintes} />
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}

// ---------- Conteneurs ----------
function ConteneursModule() {
  const [conteneurs] = useState<Conteneur[]>(initialConteneurs);
  const [selected, setSelected] = useState<Conteneur | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle>Conteneurs</CardTitle>
          <CardDescription>Référentiel utilisé par l'agent Optimisation Conteneur.</CardDescription>
        </div>
        <Button onClick={() => setImportOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" /> Importer des conteneurs
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Longueur (m)</TableHead>
              <TableHead className="text-right">Largeur (m)</TableHead>
              <TableHead className="text-right">Hauteur (m)</TableHead>
              <TableHead className="text-right">Volume (m³)</TableHead>
              <TableHead className="text-right">Poids max (kg)</TableHead>
              <TableHead>Variante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conteneurs.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                <TableCell className="font-medium">{c.type}</TableCell>
                <TableCell className="text-right">{c.longueur}</TableCell>
                <TableCell className="text-right">{c.largeur}</TableCell>
                <TableCell className="text-right">{c.hauteur}</TableCell>
                <TableCell className="text-right">{c.volume}</TableCell>
                <TableCell className="text-right">{c.poidsMax.toLocaleString("fr-FR")}</TableCell>
                <TableCell><Badge variant="outline">{c.variante}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.type}</SheetTitle>
                <SheetDescription>Variante : {selected.variante}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <Section title="Dimensions">
                  <Field label="Longueur" value={`${selected.longueur} m`} />
                  <Field label="Largeur" value={`${selected.largeur} m`} />
                  <Field label="Hauteur" value={`${selected.hauteur} m`} />
                  <Field label="Volume" value={`${selected.volume} m³`} />
                </Section>
                <Section title="Capacité & coût">
                  <Field label="Poids max" value={`${selected.poidsMax.toLocaleString("fr-FR")} kg`} />
                  <Field label="Coût moyen transport" value={`${selected.coutMoyen} €`} />
                </Section>
                <Section title="Adaptation">
                  <Field label="Produits adaptés" value={selected.produitsAdaptes} />
                  <Field label="Contraintes" value={selected.contraintes} />
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ImportDialog label="Conteneurs" open={importOpen} onOpenChange={setImportOpen} />
    </Card>
  );
}

// ---------- Palettes ----------
function PalettesModule() {
  const [palettes] = useState<Palette[]>(initialPalettes);
  const [selected, setSelected] = useState<Palette | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle>Palettes</CardTitle>
          <CardDescription>Configuration des palettes pour le calcul d'optimisation.</CardDescription>
        </div>
        <Button onClick={() => setImportOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" /> Importer des palettes
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type palette</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead className="text-right">Charge max</TableHead>
              <TableHead className="text-right">Hauteur max</TableHead>
              <TableHead>Empilable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {palettes.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                <TableCell className="font-medium">{p.type}</TableCell>
                <TableCell>{p.longueur} × {p.largeur} cm</TableCell>
                <TableCell className="text-right">{p.chargeMax} kg</TableCell>
                <TableCell className="text-right">{p.hauteurMax} cm</TableCell>
                <TableCell><Badge variant={p.empilable ? "secondary" : "outline"}>{p.empilable ? "Oui" : "Non"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.type}</SheetTitle>
                <SheetDescription>{selected.longueur} × {selected.largeur} cm</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <Section title="Caractéristiques">
                  <Field label="Charge max" value={`${selected.chargeMax} kg`} />
                  <Field label="Hauteur max" value={`${selected.hauteurMax} cm`} />
                  <Field label="Empilable" value={selected.empilable ? "Oui" : "Non"} />
                  <Field label="Gerbage autorisé" value={selected.gerbage ? "Oui" : "Non"} />
                </Section>
                <Section title="Usage">
                  <Field label="Produits compatibles" value={selected.produitsCompatibles} />
                  <Field label="Nombre max de colis" value={String(selected.nbColisMax)} />
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ImportDialog label="Palettes" open={importOpen} onOpenChange={setImportOpen} />
    </Card>
  );
}

// ---------- Clients & Informations ----------
type ClientRecord = {
  id: string;
  nom: string;
  pays: string;
  ville: string;
  type: "Distributeur" | "Grossiste" | "Industriel";
  paiement: "Virement" | "Crédit";
  delai: 30 | 60;
  devise: string;
  limiteCredit: number;
  remiseMax: number;
  margeMoyenne: number;
  priorite: "Haute" | "Moyenne" | "Basse";
  statut: "Actif" | "Inactif";
  volumeMensuel: number;
  produitsPrincipaux: string;
  sensibilitePrix: "faible" | "moyenne" | "élevée";
  frequenceCommandes: string;
  margeMin: number;
  margeMax: number;
  prixPlafond: number;
  variationMaxPct: number;
  insights: string[];
  notes: string;
  historiquePricing: { produit: string; prixMoyen: number; evolution: string }[];
};

const initialClients: ClientRecord[] = [
  {
    id: "cl1", nom: "Dakar Auto Services", pays: "Sénégal", ville: "Dakar",
    type: "Distributeur", paiement: "Virement", delai: 30, devise: "EUR",
    limiteCredit: 50000, remiseMax: 3, margeMoyenne: 14, priorite: "Haute", statut: "Actif",
    volumeMensuel: 1200, produitsPrincipaux: "Lubrifiants, additifs", sensibilitePrix: "élevée",
    frequenceCommandes: "Mensuelle",
    margeMin: 12, margeMax: 18, prixPlafond: 130, variationMaxPct: 2,
    insights: ["Client sensible aux prix", "Privilégie la stabilité", "Refuse les hausses rapides"],
    notes: "Partenariat stratégique — ne pas dépasser 2% d'augmentation par trimestre.",
    historiquePricing: [
      { produit: "Lubrifiant 20L", prixMoyen: 118, evolution: "+1.5%" },
      { produit: "Additif 5L", prixMoyen: 42, evolution: "stable" },
    ],
  },
  {
    id: "cl2", nom: "Sénégal Fleet Lubricants", pays: "Sénégal", ville: "Dakar",
    type: "Grossiste", paiement: "Crédit", delai: 60, devise: "EUR",
    limiteCredit: 120000, remiseMax: 5, margeMoyenne: 11, priorite: "Haute", statut: "Actif",
    volumeMensuel: 2800, produitsPrincipaux: "Huiles industrielles, fûts 200L", sensibilitePrix: "moyenne",
    frequenceCommandes: "Bimensuelle",
    margeMin: 10, margeMax: 16, prixPlafond: 1050, variationMaxPct: 3,
    insights: ["Accepte des volumes élevés", "Client préfère volume plutôt que marge"],
    notes: "Gros volumes — privilégier remplissage conteneur 40' HC.",
    historiquePricing: [
      { produit: "Huile 200L", prixMoyen: 970, evolution: "+1%" },
    ],
  },
  {
    id: "cl3", nom: "Abidjan Retail Group", pays: "Côte d'Ivoire", ville: "Abidjan",
    type: "Distributeur", paiement: "Virement", delai: 30, devise: "EUR",
    limiteCredit: 35000, remiseMax: 2, margeMoyenne: 17, priorite: "Moyenne", statut: "Actif",
    volumeMensuel: 850, produitsPrincipaux: "Lubrifiants moteurs", sensibilitePrix: "faible",
    frequenceCommandes: "Mensuelle",
    margeMin: 15, margeMax: 22, prixPlafond: 145, variationMaxPct: 4,
    insights: ["Peu sensible au prix", "Recherche qualité et délai"],
    notes: "Tolère hausses jusqu'à 4%. Marge confortable possible.",
    historiquePricing: [
      { produit: "Huile hydraulique", prixMoyen: 135, evolution: "+2%" },
    ],
  },
  {
    id: "cl4", nom: "Bamako Automotive Supply", pays: "Mali", ville: "Bamako",
    type: "Industriel", paiement: "Crédit", delai: 60, devise: "EUR",
    limiteCredit: 80000, remiseMax: 4, margeMoyenne: 13, priorite: "Moyenne", statut: "Inactif",
    volumeMensuel: 600, produitsPrincipaux: "Additifs, huiles", sensibilitePrix: "élevée",
    frequenceCommandes: "Trimestrielle",
    margeMin: 11, margeMax: 17, prixPlafond: 120, variationMaxPct: 2,
    insights: ["Risque de refus si prix élevé", "Délai paiement long à surveiller"],
    notes: "Compte en pause depuis 2 mois — relancer avec offre attractive.",
    historiquePricing: [
      { produit: "Additif 5L", prixMoyen: 40, evolution: "-1%" },
    ],
  },
];

function ClientsModule() {
  const [clients] = useState<ClientRecord[]>(initialClients);
  const [selected, setSelected] = useState<ClientRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pays, setPays] = useState<string>("Tous");
  const [type, setType] = useState<string>("Tous");
  const [statut, setStatut] = useState<string>("Tous");

  const paysOpts = useMemo(() => ["Tous", ...Array.from(new Set(clients.map((c) => c.pays)))], [clients]);

  const filtered = clients.filter(
    (c) =>
      (pays === "Tous" || c.pays === pays) &&
      (type === "Tous" || c.type === type) &&
      (statut === "Tous" || c.statut === statut),
  );

  return (
    <div className="space-y-4">
      <Card className="border-ai/30 bg-ai/5">
        <CardContent className="p-4 flex items-center gap-3 text-sm">
          <Sparkles className="h-4 w-4 text-ai" />
          <span>
            Ces données sont utilisées par les agents <strong>Pricing</strong>, <strong>Export</strong> et le{" "}
            <strong>Copilot IA</strong> pour personnaliser leurs recommandations.
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Clients & Informations</CardTitle>
            <CardDescription>Centralisez les conditions commerciales et les règles métier par client.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={pays} onChange={(e) => setPays(e.target.value)}>
              {paysOpts.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {["Tous", "Distributeur", "Grossiste", "Industriel"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={statut} onChange={(e) => setStatut(e.target.value)}>
              {["Tous", "Actif", "Inactif"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <Button onClick={() => setImportOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" /> Importer des clients
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom client</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead className="text-right">Marge moy.</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                  <TableCell className="font-medium">{c.nom}</TableCell>
                  <TableCell>{c.pays}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{c.paiement} • {c.delai}j</TableCell>
                  <TableCell className="text-right">{c.margeMoyenne}%</TableCell>
                  <TableCell><Badge variant={c.priorite === "Haute" ? "default" : "outline"}>{c.priorite}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={c.statut === "Actif" ? "secondary" : "outline"}>{c.statut}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.nom}</SheetTitle>
                <SheetDescription>{selected.ville}, {selected.pays} — {selected.type}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <Section title="Informations générales">
                  <Field label="Pays" value={selected.pays} />
                  <Field label="Ville" value={selected.ville} />
                  <Field label="Type client" value={selected.type} />
                  <Field label="Statut" value={selected.statut} />
                </Section>

                <Section title="Données commerciales">
                  <Field label="Volume mensuel" value={`${selected.volumeMensuel} unités`} />
                  <Field label="Produits principaux" value={selected.produitsPrincipaux} />
                  <Field label="Sensibilité prix" value={selected.sensibilitePrix} />
                  <Field label="Fréquence commandes" value={selected.frequenceCommandes} />
                </Section>

                <Section title="Conditions commerciales">
                  <Field label="Mode de paiement" value={selected.paiement} />
                  <Field label="Délai de paiement" value={`${selected.delai} jours`} />
                  <Field label="Devise" value={selected.devise} />
                  <Field label="Limite de crédit" value={`${selected.limiteCredit.toLocaleString("fr-FR")} €`} />
                  <Field label="Remise max" value={`${selected.remiseMax}%`} />
                  <Field label="Marge moyenne" value={`${selected.margeMoyenne}%`} />
                </Section>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Historique pricing</h3>
                  <div className="rounded-md border divide-y">
                    {selected.historiquePricing.map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-3 text-sm">
                        <span>{h.produit}</span>
                        <span className="text-muted-foreground">Prix moyen <strong className="text-foreground">{h.prixMoyen} €</strong> · {h.evolution}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Règles métier client (utilisées par l'IA)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Marge minimale" value={`${selected.margeMin}%`} />
                    <Field label="Marge maximale" value={`${selected.margeMax}%`} />
                    <Field label="Prix plafond" value={`${selected.prixPlafond} €`} />
                    <Field label="Remise maximale" value={`${selected.remiseMax}%`} />
                    <Field label="Variation prix max" value={`${selected.variationMaxPct}%`} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-ai" /> Connaissance IA client
                  </h3>
                  <div className="space-y-2">
                    {selected.insights.map((ins, i) => (
                      <div key={i} className="rounded-md border border-ai/30 bg-ai/5 p-3 text-sm">💡 {ins}</div>
                    ))}
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Notes stratégiques</div>
                      <p className="text-sm">{selected.notes}</p>
                    </div>
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
                      <strong>Agent Pricing :</strong> Marge limitée à {selected.margeMax}% — variation max {selected.variationMaxPct}%.
                      <br />
                      <strong>Copilot :</strong> Sensibilité prix <em>{selected.sensibilitePrix}</em> — adapter la stratégie.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ImportDialog label="Clients" open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

