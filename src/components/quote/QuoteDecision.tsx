import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download, CheckCircle2, XCircle, UploadCloud, FileCheck2, Paperclip, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { downloadQuotePdf, quotesStore, quoteTotal, eur, type Quote } from "@/lib/quotes-store";

const REASONS = [
  "Prix", "Quantité", "Produit", "Délai", "Conditions de paiement",
  "Transport / logistique", "Conditions commerciales", "Autre",
];

const MAX_MB = 10;

function FileDrop({
  file, onFile, accept = "PDF, JPG, PNG", hint = "Déposez votre devis signé ici",
}: { file: File | null; onFile: (f: File | null) => void; accept?: string; hint?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handle = (f?: File | null) => {
    if (!f) return;
    const ok = ["application/pdf", "image/jpeg", "image/png"].includes(f.type);
    if (!ok) return toast.error("Format non supporté", { description: "Formats acceptés : PDF, JPG, PNG." });
    if (f.size > MAX_MB * 1024 * 1024) return toast.error("Fichier trop volumineux", { description: `Taille maximale : ${MAX_MB} Mo.` });
    onFile(f);
    toast.success("Document importé", { description: f.name });
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-smooth",
          over ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
          file && "border-success/50 bg-success/5",
        )}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-success">
            <FileCheck2 className="h-4 w-4" /> {file.name}
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto h-6 w-6 text-muted-foreground" />
            <div className="mt-2 text-sm font-medium">{hint}</div>
            <div className="text-xs text-muted-foreground">Formats : {accept} · Taille maximale : {MAX_MB} Mo</div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {file && (
        <button className="mt-2 text-xs text-muted-foreground underline" onClick={() => onFile(null)}>
          Retirer le document
        </button>
      )}
    </div>
  );
}

export function AcceptDialog({ quote, open, onOpenChange }: { quote: Quote; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [signer, setSigner] = useState("Jean Kouassi");
  const [role, setRole] = useState("Directeur commercial");
  const [comment, setComment] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [downloaded, setDownloaded] = useState(!!quote.audit.downloadedAt);

  const steps = [
    { label: "Télécharger le devis", done: downloaded },
    { label: "Signer le document", done: !!file },
    { label: "Importer le devis signé", done: !!file },
    { label: "Confirmer", done: confirmed && !!file },
  ];

  const submit = () => {
    if (!file || !signer.trim() || !confirmed) return;
    quotesStore.accept(quote.id, {
      signer: signer.trim(),
      role: role.trim(),
      comment: comment.trim() || undefined,
      fileName: `${quote.id}-SIGNED.pdf`,
    });
    toast.success("Votre devis a été accepté avec succès. AKWA a été informé.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validation du devis</DialogTitle>
          <DialogDescription>
            Pour confirmer votre accord, veuillez télécharger le devis, le signer puis importer la version signée.
          </DialogDescription>
        </DialogHeader>

        <ol className="grid gap-2 sm:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.label} className={cn("rounded-lg border p-2.5 text-xs", s.done ? "border-success/40 bg-success/5" : "border-border bg-muted/30")}>
              <div className="flex items-center gap-1.5 font-medium">
                <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[10px]", s.done ? "bg-success text-white" : "bg-muted-foreground/20")}>
                  {s.done ? "✓" : i + 1}
                </span>
                {s.label}
              </div>
            </li>
          ))}
        </ol>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => { downloadQuotePdf(quote); setDownloaded(true); }}
        >
          <Download className="h-4 w-4" /> Télécharger le devis PDF
        </Button>

        <FileDrop file={file} onFile={setFile} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="signer">Nom du signataire</Label>
            <Input id="signer" value={signer} onChange={(e) => setSigner(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Fonction</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="comment">Commentaire (facultatif)</Label>
          <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={2} />
        </div>

        <label className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
          <span>Je confirme avoir pris connaissance et accepté les conditions de ce devis.</span>
        </label>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button className="gap-2" disabled={!file || !confirmed || !signer.trim()} onClick={submit}>
            <ShieldCheck className="h-4 w-4" /> Confirmer l'acceptation
          </Button>
        </DialogFooter>
        {!file && (
          <p className="text-xs text-muted-foreground">
            L'acceptation reste indisponible tant que le devis signé n'a pas été importé.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RefuseDialog({ quote, open, onOpenChange }: { quote: Quote; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirm, setConfirm] = useState(false);

  const valid = !!reason && message.trim().length > 10;

  const send = () => {
    quotesStore.refuse(quote.id, { reason, message: message.trim(), fileName: file?.name });
    toast("Votre refus a été transmis à AKWA", {
      description: "L'équipe AKWA étudie votre demande et pourra vous proposer une nouvelle version.",
    });
    setConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Refuser ce devis</DialogTitle>
            <DialogDescription>
              Votre retour sera directement transmis à l'équipe AKWA afin qu'elle puisse étudier votre demande.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>Motif du refus *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Sélectionnez un motif" /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg">Message à AKWA *</Label>
            <Textarea
              id="msg"
              rows={4}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Les conditions de paiement proposées ne correspondent pas à notre accord initial. Pouvez-vous nous proposer un paiement à 30/70 ?"
            />
            <p className="text-[11px] text-muted-foreground">{message.length}/1000 caractères</p>
          </div>

          <div className="space-y-1.5">
            <Label>Pièce jointe (facultatif)</Label>
            <FileDrop file={file} onFile={setFile} hint="Déposez un document justificatif" />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button variant="destructive" className="gap-2" disabled={!valid} onClick={() => setConfirm(true)}>
              <XCircle className="h-4 w-4" /> Envoyer le refus à AKWA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le refus du devis {quote.id} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le devis sera marqué comme refusé et votre message ({reason}) sera transmis à l'équipe AKWA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revenir</AlertDialogCancel>
            <AlertDialogAction onClick={send}>Confirmer le refus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function NewVersionDialog({ quote, open, onOpenChange }: { quote: Quote; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [message, setMessage] = useState(
    `Bonjour, nous souhaitons obtenir une nouvelle version du devis ${quote.id}.`,
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Demander un nouveau devis</DialogTitle>
          <DialogDescription>
            Ce devis a expiré le {new Date(quote.validUntil).toLocaleDateString("fr-FR")}. Précisez votre besoin à AKWA.
          </DialogDescription>
        </DialogHeader>
        <Textarea rows={4} maxLength={800} value={message} onChange={(e) => setMessage(e.target.value)} />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            disabled={message.trim().length < 10}
            onClick={() => {
              quotesStore.requestNewVersion(quote.id, message.trim());
              toast.success("Demande envoyée à AKWA", { description: "Un nouveau devis vous sera transmis prochainement." });
              onOpenChange(false);
            }}
          >
            Envoyer la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DecisionZone({ quote }: { quote: Quote }) {
  const [accept, setAccept] = useState(false);
  const [refuse, setRefuse] = useState(false);
  const [renew, setRenew] = useState(false);
  const expired = quote.status === "Expiré";
  const decided = quote.status === "Accepté" || quote.status === "Refusé";

  return (
    <div className="sticky bottom-4 z-30 rounded-2xl border border-border bg-card/95 p-4 shadow-elegant backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Votre décision</div>
          <div className="text-xs text-muted-foreground">
            {expired
              ? `Ce devis a expiré le ${new Date(quote.validUntil).toLocaleDateString("fr-FR")}.`
              : decided
                ? `Décision enregistrée : ${quote.status.toLowerCase()}.`
                : `Montant total du devis : ${eur(quoteTotal(quote))}`}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => downloadQuotePdf(quote)}>
            <Download className="h-4 w-4" /> Télécharger le devis PDF
          </Button>
          {expired ? (
            <>
              <Button disabled className="gap-2"><CheckCircle2 className="h-4 w-4" /> Accepter le devis</Button>
              <Button className="gap-2" onClick={() => setRenew(true)}>
                <AlertTriangle className="h-4 w-4" /> Demander un nouveau devis
              </Button>
            </>
          ) : decided ? (
            <Button disabled variant="secondary" className="gap-2">
              <Paperclip className="h-4 w-4" /> Décision transmise à AKWA
            </Button>
          ) : (
            <>
              <Button variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setRefuse(true)}>
                <XCircle className="h-4 w-4" /> Refuser le devis
              </Button>
              <Button className="gap-2" onClick={() => setAccept(true)}>
                <CheckCircle2 className="h-4 w-4" /> Accepter le devis
              </Button>
            </>
          )}
        </div>
      </div>

      <AcceptDialog quote={quote} open={accept} onOpenChange={setAccept} />
      <RefuseDialog quote={quote} open={refuse} onOpenChange={setRefuse} />
      <NewVersionDialog quote={quote} open={renew} onOpenChange={setRenew} />
    </div>
  );
}
