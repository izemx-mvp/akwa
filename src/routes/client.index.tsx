import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/StatCard";
import { AgentBadge } from "@/components/AgentBadge";
import { orders, products, formatCurrency } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Package, ListOrdered, TrendingUp, Sparkles, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/client/")({
  component: ClientDashboard,
});

function ClientDashboard() {
  const myOrders = orders.slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bienvenue, Atlantic Trade SARL</h1>
          <p className="text-sm text-muted-foreground mt-1">Voici l'activité de votre compte aujourd'hui.</p>
        </div>
        <Link to="/client/new-order">
          <Button className="bg-gradient-primary shadow-elegant gap-2">
            <Sparkles className="h-4 w-4" /> Lancer une commande intelligente
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Commandes actives" value="4" delta="+1" hint="cette semaine" icon={<ListOrdered className="h-4 w-4" />} />
        <StatCard label="En transit" value="2" hint="ETA 6 jours" icon={<Package className="h-4 w-4" />} />
        <StatCard label="Dépenses YTD" value={formatCurrency(1240000)} delta="+8,4 %" hint="vs an dernier" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Économies IA" value={formatCurrency(28400)} delta="+3,1k $" hint="ce trimestre" icon={<Sparkles className="h-4 w-4" />} intent="ai" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Commandes récentes</h3>
            <Link to="/client/orders" className="text-xs text-primary hover:underline">Voir tout</Link>
          </div>
          <div className="divide-y divide-border">
            {myOrders.map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/40 transition-smooth">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{o.reference}</div>
                  <div className="text-xs text-muted-foreground">{o.destination} · {o.lines.length} ligne(s) · {o.containerFillPct}% remplissage</div>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{o.status}</span>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{o.createdAt}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <AgentBadge name="AI Order Assistant" pulse />
          <h3 className="mt-4 text-lg font-semibold">Économisez 740 $ sur votre prochaine commande</h3>
          <p className="mt-2 text-sm text-white/80 leading-relaxed">
            J'ai noté que vos 3 dernières commandes plafonnaient à ~64 % de remplissage. Combiner Butane 12kg avec Lubrifiant Pack XL débloquerait un chargement optimal et améliorerait la marge.
          </p>
          <Link to="/client/new-order">
            <Button variant="secondary" size="sm" className="mt-4 gap-1.5">
              Démarrer une commande optimisée <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Recommandé pour vous</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {products.slice(0, 6).map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-3 hover:shadow-elegant transition-smooth">
              <div className="text-3xl">{p.image}</div>
              <div className="mt-2 text-xs font-medium line-clamp-2">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{formatCurrency(p.unitPrice)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
