import { useState } from "react";
import { toast } from "sonner";
import { FileText, Download, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard, Chip, EmptyState } from "./shared";
import { downloadMock, exportOrderStore, type DocStatus, type ExportDoc, type ExportOrder } from "@/lib/export-order-store";

const docTone: Record<DocStatus, "success" | "warning" | "neutral" | "info"> = {
  Disponible: "success",
  "En préparation": "warning",
  "À venir": "neutral",
  "À valider": "info",
  "Disponible après embarquement": "neutral",
};

export function TabDocuments({ order }: { order: ExportOrder }) {
  const [cat, setCat] = useState("all");
  const [preview, setPreview] = useState<ExportDoc | null>(null);
  const [correction, setCorrection] = useState<ExportDoc | null>(null);
  const [note, setNote] = useState("");

  const docs = order.documents.filter((d) => cat === "all" || d.category === cat);

  return (
    <SectionCard
      title="Documents export"
      subtitle={`${order.documents.filter((d) => d.status === "Disponible").length} disponible(s) sur ${order.documents.length}`}
      icon={FileText}
      dense
      action={
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
            <SelectItem value="Export">Export</SelectItem>
            <SelectItem value="Transport">Transport</SelectItem>
            <SelectItem value="Assurance">Assurance</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {docs.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun document dans cette catégorie" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Document</th>
                <th className="px-4 py-2.5 text-left font-medium">Référence</th>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-left font-medium">Statut</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {docs.map((d) => {
                const available = d.status === "Disponible";
                return (
                  <tr key={d.id} className="transition-smooth hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{d.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{d.reference}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{d.date ?? "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={docTone[d.status]}>{d.status}</Chip></td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" disabled={!available && d.status !== "À valider"} onClick={() => setPreview(d)}>
                          <Eye className="h-3.5 w-3.5" /> Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!available && d.status !== "À valider"}
                          onClick={() => {
                            downloadMock(`${d.reference}.txt`, `${d.name}\nRéférence : ${d.reference}\nCommande : ${order.reference}\nClient : ${order.client}`);
                            toast.success(`${d.name} téléchargé.`);
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setCorrection(d)}>
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>{preview?.reference} • {preview?.date ?? "sans date"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-6 font-mono text-xs leading-relaxed">
            <div>AKWA EXPORT — {preview?.name?.toUpperCase()}</div>
            <div>Commande : {order.reference}</div>
            <div>Client : {order.client}</div>
            <div>Destination : {order.city}, {order.country}</div>
            <div>Incoterm : {order.incoterm}</div>
            <div>Navire : {order.vessel} / {order.voyage}</div>
            <div className="pt-3 text-muted-foreground">— Aperçu simulé du document —</div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!correction} onOpenChange={(v) => !v && setCorrection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une correction</DialogTitle>
            <DialogDescription>{correction?.name} — {correction?.reference}</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Précisez la correction attendue…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrection(null)}>Annuler</Button>
            <Button
              disabled={!note.trim()}
              onClick={() => {
                exportOrderStore.addMessage({ text: `[Correction document — ${correction?.name}] ${note}`, category: "Documents" });
                toast.success("Demande de correction envoyée.");
                setNote(""); setCorrection(null);
              }}
            >
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
