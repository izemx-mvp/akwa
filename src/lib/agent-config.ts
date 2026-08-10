import { useSyncExternalStore } from "react";
import type { AgentKey } from "./agent-hub";

export type AgentSetting =
  | { key: string; label: string; type: "switch"; value: boolean; hint?: string }
  | { key: string; label: string; type: "number"; value: number; unit?: string; hint?: string }
  | { key: string; label: string; type: "select"; value: string; options: string[]; hint?: string }
  | { key: string; label: string; type: "text"; value: string; hint?: string };

export type AgentConfig = {
  autonomy: "Suggestion" | "Semi-automatique" | "Automatique";
  notify: boolean;
  owner: string;
  rules: string[];
  settings: AgentSetting[];
};

const base = (owner: string, rules: string[], settings: AgentSetting[]): AgentConfig => ({
  autonomy: "Suggestion", notify: true, owner, rules, settings,
});

let configs: Record<AgentKey, AgentConfig> = {
  pricing: base("Sofia El Mansouri", [
    "Ne jamais proposer un prix sous la marge minimale de 15 %.",
    "Prioriser les règles tarifaires actives sur le prix catalogue.",
    "Alerter dès qu'un coût d'achat augmente de plus de 3 %.",
  ], [
    { key: "minMargin", label: "Marge minimale autorisée", type: "number", value: 15, unit: "%" },
    { key: "targetMargin", label: "Marge cible", type: "number", value: 20, unit: "%" },
    { key: "costAlert", label: "Seuil d'alerte hausse de coût", type: "number", value: 3, unit: "%" },
    { key: "rounding", label: "Arrondi des prix", type: "select", value: "0,01 €", options: ["0,01 €", "0,05 €", "0,10 €"] },
    { key: "autoApply", label: "Appliquer automatiquement les règles aux devis", type: "switch", value: true },
  ]),
  devis: base("Sofia El Mansouri", [
    "Utiliser le prix applicable après règles tarifaires comme prix de départ.",
    "Tracer toute modification manuelle de prix dans l'audit.",
    "Bloquer l'envoi d'un devis sous 12 % de marge sans validation manager.",
  ], [
    { key: "validity", label: "Validité par défaut d'un devis", type: "number", value: 30, unit: "jours" },
    { key: "minMarginQuote", label: "Marge minimale devis", type: "number", value: 12, unit: "%" },
    { key: "autoFees", label: "Ajouter automatiquement les frais logistiques", type: "switch", value: true },
    { key: "template", label: "Modèle de devis", type: "select", value: "Export standard", options: ["Export standard", "Groupage", "Grand compte"] },
  ]),
  marge: base("Yassine Bennani", [
    "Signaler toute commande dont la marge nette passe sous 15 %.",
    "Comparer systématiquement à la marge moyenne du client.",
  ], [
    { key: "threshold", label: "Seuil d'alerte marge", type: "number", value: 15, unit: "%" },
    { key: "target", label: "Objectif de marge", type: "number", value: 20, unit: "%" },
    { key: "includeFees", label: "Inclure les frais annexes dans le calcul", type: "switch", value: true },
  ]),
  export: base("Yassine Bennani", [
    "Vérifier la présence des fiches de données de sécurité (SDS) et le classement ADR des fluides.",
    "Alerter à J-8 si le solde client n'est pas encaissé.",
  ], [
    { key: "leadTime", label: "Délai d'alerte avant chargement", type: "number", value: 8, unit: "jours" },
    { key: "docCheck", label: "Contrôle documentaire automatique", type: "switch", value: true },
    { key: "incoterm", label: "Incoterm par défaut", type: "select", value: "CIF", options: ["EXW", "FOB", "CIF", "CFR", "DAP"] },
  ]),
  container: base("Yassine Bennani", [
    "Ne jamais dépasser 90 % du poids maximal autorisé.",
    "Privilégier le plan au coût de fret le plus bas à remplissage équivalent.",
  ], [
    { key: "maxFill", label: "Taux de remplissage cible", type: "number", value: 90, unit: "%" },
    { key: "maxWeight", label: "Charge maximale par conteneur", type: "number", value: 24000, unit: "kg" },
    { key: "preferred", label: "Type de conteneur privilégié", type: "select", value: "40' High Cube", options: ["20'", "40' Standard", "40' High Cube"] },
    { key: "stack", label: "Autoriser le gerbage des palettes", type: "switch", value: true },
  ]),
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const agentConfigStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  get: () => configs,
  update(agent: AgentKey, patch: Partial<AgentConfig>) {
    configs = { ...configs, [agent]: { ...configs[agent], ...patch } };
    emit();
  },
  setSetting(agent: AgentKey, key: string, value: boolean | number | string) {
    const cfg = configs[agent];
    configs = {
      ...configs,
      [agent]: { ...cfg, settings: cfg.settings.map((s) => (s.key === key ? ({ ...s, value } as AgentSetting) : s)) },
    };
    emit();
  },
  addRule(agent: AgentKey, rule: string) {
    configs = { ...configs, [agent]: { ...configs[agent], rules: [...configs[agent].rules, rule] } };
    emit();
  },
  removeRule(agent: AgentKey, index: number) {
    configs = { ...configs, [agent]: { ...configs[agent], rules: configs[agent].rules.filter((_, i) => i !== index) } };
    emit();
  },
};

export function useAgentConfig() {
  return useSyncExternalStore(
    (cb) => agentConfigStore.subscribe(cb),
    () => configs,
    () => configs,
  );
}
