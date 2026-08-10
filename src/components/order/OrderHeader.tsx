import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Download, MessageSquare, FileText, AlertTriangle, PenLine, Check, ChevronRight, Package, FolderDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, MiniBar } from "./shared";
import { cn } from "@/lib/utils";
import { STEPS, downloadMock, eur, exportOrderStore, type ExportOrder, type Message } from "@/lib/export-order-store";

const CONTACT_TYPES = [
  "Question commerciale",
  "Modification de commande",
  "Question logistique",
  "Document",
  "Paiement",
  "Réclamation",
  "Autre",
];

const EXPORT_PARTS = [
  "Résumé commande",
  "Articles",
  "Factures",
  "Documents export",
  "Documents transport",
  "Historique",
  "Paiements",
  "Timeline logistique",
];

export function OrderHeader({ order, onGoTab }: { order: ExportOrder; onGoTab: (t: string) => void }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [anomalyOpen, setAnomalyOpen] = useState(false);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState(CONTACT_TYPES[0]);
  const [anomaly, setAnomaly] = useState("");
  const [instruction, setInstruction] = useState("");
  const [parts, setParts] = useState<string[]>(EXPORT_PARTS.slice(0, 4));

  const currentIndex = 2; // Préparation
  const catToCategory: Record<string, Message["category"]> = {
    "Question commerciale": "Commercial",
    "Modification de commande": "Commercial",
    "Question logistique": "Logistique",
    Document: "Documents",
    Paiement: "Paiement",
    Réclamation: "Qualité",
    Autre: "Commercial",
  };

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/client" className="hover:text-foreground transition-smooth">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/client/orders" className="hover:text-foreground transition-smooth">Mes commandes</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{order.reference}</span>
      </nav>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/95 via-primary to-primary-glow text-primary-foreground shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">Commande {order.reference}</h1>
              <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
                {order.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Client", order.client],
                ["Destination", `${order.city}, ${order.country}`],
                ["Créée le", order.createdAt],
                ["Incoterm", order.incoterm],
                ["Devise", order.currency],
                ["Montant total", eur(order.totals.total)],
              ].map(([l, v]) => (
                <div key={l}>
                  <div className="text-[10px] uppercase tracking-wider text-primary-foreground/60">{l}</div>
                  <div className="truncate font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => { downloadMock(`recap-${order.reference}.txt`, `Récapitulatif ${order.reference}\nClient: ${order.client}\nTotal: ${eur(order.totals.total)}`); toast.success("Récapitulatif téléchargé."); }}>
              <Download className="h-3.5 w-3.5" /> Récapitulatif
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setContactOpen(true)}>
              <MessageSquare className="h-3.5 w-3.5" /> Contacter AKWA
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onGoTab("documents")}>
              <FileText className="h-3.5 w-3.5" /> Documents
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAnomalyOpen(true)}>
              <AlertTriangle className="h-3.5 w-3.5" /> Signaler
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setInstructionOpen(true)}>
              <PenLine className="h-3.5 w-3.5" /> Instruction
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setExportOpen(true)}>
              <FolderDown className="h-3.5 w-3.5" /> Exporter le dossier
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <div className="relative border-t border-primary-foreground/15 bg-primary-foreground/5 px-5 py-4 backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium">Étape actuelle : {order.currentStep}</span>
            <span className="text-primary-foreground/80">Progression {order.progressPct} %</span>
          </div>
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex;
              return (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold transition-smooth",
                        done && "border-transparent bg-success text-success-foreground",
                        current && "border-primary-foreground bg-primary-foreground text-primary ring-4 ring-primary-foreground/25",
                        !done && !current && "border-primary-foreground/30 text-primary-foreground/50",
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className={cn("hidden whitespace-nowrap text-[10px] sm:block", current ? "font-semibold" : "text-primary-foreground/60")}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="mx-1.5 mb-4 h-0.5 flex-1 rounded-full bg-primary-foreground/20">
                      <div className={cn("h-full rounded-full bg-success transition-all", done ? "w-full" : "w-0")} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3">
            <MiniBar pct={order.progressPct} tone="success" className="bg-primary-foreground/20" />
          </div>
        </div>
      </div>

      {/* Contact drawer */}
      <Sheet open={contactOpen} onOpenChange={setContactOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Contacter AKWA</SheetTitle>
            <SheetDescription>Message rattaché à la commande {order.reference}</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4">
            <div className="space-y-1.5">
              <Label>Type de demande</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sujet</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex : Confirmation du packaging" />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Votre message…" />
            </div>
            <Button
              className="w-full"
              disabled={!subject.trim() || !body.trim()}
              onClick={() => {
                exportOrderStore.addMessage({ text: `${subject} — ${body}`, category: catToCategory[type] });
                toast.success("Message envoyé à l'équipe AKWA.");
                setSubject(""); setBody(""); setContactOpen(false); onGoTab("echanges");
              }}
            >
              Envoyer le message
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Anomalie */}
      <Dialog open={anomalyOpen} onOpenChange={setAnomalyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler une anomalie</DialogTitle>
            <DialogDescription>Décrivez l'écart constaté sur la commande {order.reference}.</DialogDescription>
          </DialogHeader>
          <Textarea rows={5} value={anomaly} onChange={(e) => setAnomaly(e.target.value)} placeholder="Ex : écart de quantité sur les conserves…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnomalyOpen(false)}>Annuler</Button>
            <Button
              disabled={!anomaly.trim()}
              onClick={() => {
                exportOrderStore.addMessage({ text: `[Anomalie signalée] ${anomaly}`, category: "Qualité" });
                exportOrderStore.log("Anomalie signalée", undefined, anomaly.slice(0, 40));
                toast.success("Anomalie transmise à AKWA.");
                setAnomaly(""); setAnomalyOpen(false); onGoTab("echanges");
              }}
            >
              Transmettre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instruction */}
      <Dialog open={instructionOpen} onOpenChange={setInstructionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une instruction</DialogTitle>
            <DialogDescription>Consigne transmise aux équipes préparation et export.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Ex : renforcer le filmage des palettes…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstructionOpen(false)}>Annuler</Button>
            <Button
              disabled={!instruction.trim()}
              onClick={() => {
                exportOrderStore.addInstruction(instruction);
                toast.success("Instruction enregistrée.");
                setInstruction(""); setInstructionOpen(false); onGoTab("echanges");
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export dossier */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Exporter le dossier commande</DialogTitle>
            <DialogDescription>Sélectionnez les éléments à inclure dans l'archive.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXPORT_PARTS.map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2.5 text-sm transition-smooth hover:bg-muted/40">
                <Checkbox
                  checked={parts.includes(p)}
                  onCheckedChange={(v) => setParts((prev) => (v ? [...prev, p] : prev.filter((x) => x !== p)))}
                />
                {p}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Annuler</Button>
            <Button
              disabled={parts.length === 0}
              onClick={() => {
                downloadMock(
                  `dossier-${order.reference}.txt`,
                  `Dossier commande ${order.reference}\nÉléments inclus :\n- ${parts.join("\n- ")}`,
                );
                toast.success(`Dossier généré (${parts.length} sections).`);
                setExportOpen(false);
              }}
            >
              Générer le dossier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 lg:hidden">
        <StatusBadge status={order.status} />
      </div>
    </div>
  );
}
