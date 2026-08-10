import { useState } from "react";
import { toast } from "sonner";
import { MessagesSquare, Send, Paperclip, PenLine, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard, Chip, EmptyState } from "./shared";
import { cn } from "@/lib/utils";
import { exportOrderStore, type ExportOrder, type Instruction, type Message } from "@/lib/export-order-store";

const CATEGORIES: Message["category"][] = ["Commercial", "Logistique", "Documents", "Paiement", "Qualité"];

const insTone: Record<Instruction["status"], "info" | "primary" | "warning" | "success" | "danger"> = {
  Nouvelle: "info",
  "Prise en compte": "primary",
  "En cours": "warning",
  Appliquée: "success",
  Refusée: "danger",
};

export function TabEchanges({ order }: { order: ExportOrder }) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState<Message["category"]>("Commercial");
  const [filter, setFilter] = useState("all");
  const [file, setFile] = useState("");
  const [newIns, setNewIns] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const msgs = order.messages.filter((m) => filter === "all" || m.category === filter);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <SectionCard
        className="lg:col-span-3"
        title="Échanges avec AKWA"
        subtitle={`${order.messages.length} message(s) sur cette commande`}
        icon={MessagesSquare}
        action={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      >
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {msgs.length === 0 ? (
            <EmptyState icon={MessagesSquare} title="Aucun message dans cette catégorie" />
          ) : (
            msgs.map((m) => (
              <div key={m.id} className={cn("flex", m.side === "client" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl border px-3 py-2 text-sm shadow-card",
                    m.side === "client" ? "border-primary/20 bg-primary/5" : "border-border bg-card",
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{m.author}</span>
                    <span>{m.at}</span>
                    <Chip tone="neutral">{m.category}</Chip>
                  </div>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.attachment && (
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px]">
                      <Paperclip className="h-3 w-3" /> {m.attachment}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-border p-3">
          <div className="flex flex-wrap gap-2">
            <Select value={cat} onValueChange={(v) => setCat(v as Message["category"])}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="file" className="h-8 w-56 text-xs" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />
          </div>
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message à l'équipe AKWA…" />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!text.trim()}
              onClick={() => {
                exportOrderStore.addMessage({ text, category: cat, attachment: file || undefined });
                toast.success("Message envoyé.");
                setText(""); setFile("");
              }}
            >
              <Send className="h-3.5 w-3.5" /> Envoyer
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="lg:col-span-2" title="Instructions client" subtitle="Consignes transmises à AKWA" icon={PenLine}>
        <div className="space-y-2">
          <Textarea rows={3} value={newIns} onChange={(e) => setNewIns(e.target.value)} placeholder="Nouvelle instruction…" />
          <Button
            size="sm"
            className="w-full"
            disabled={!newIns.trim()}
            onClick={() => {
              exportOrderStore.addInstruction(newIns);
              toast.success("Instruction ajoutée.");
              setNewIns("");
            }}
          >
            Ajouter l'instruction
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {order.instructions.length === 0 && <EmptyState icon={PenLine} title="Aucune instruction" />}
          {order.instructions.map((i) => {
            const editable = i.status === "Nouvelle" || i.status === "Prise en compte";
            return (
              <div key={i.id} className="rounded-lg border border-border p-3">
                {editId === i.id ? (
                  <div className="space-y-2">
                    <Textarea rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} />
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="h-3.5 w-3.5" /></Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          exportOrderStore.updateInstruction(i.id, editText);
                          setEditId(null);
                          toast.success("Instruction modifiée.");
                        }}
                      >
                        <Check className="h-3.5 w-3.5" /> Enregistrer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">{i.text}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Chip tone={insTone[i.status]}>{i.status}</Chip>
                        <span>{i.createdAt}</span>
                        {i.handler && <span>• {i.handler}</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!editable}
                          onClick={() => { setEditId(i.id); setEditText(i.text); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!editable}
                          onClick={() => { exportOrderStore.removeInstruction(i.id); toast.success("Instruction supprimée."); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
