import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/StatCard";
import { AgentBadge } from "@/components/AgentBadge";
import { monthlyRevenue, countryPerformance, formatCurrency } from "@/lib/mock-data";
import { agents } from "@/lib/agents";
import { TrendingUp, ShoppingCart, Package, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "AKWA AI — Admin Cockpit" }],
  }),
  component: AdminDashboard,
});

const insights = [
  { sev: "warning", agent: "Margin Analyst", text: "Margin in Côte d'Ivoire decreased by 4% this week.", action: "Drill down" },
  { sev: "info", agent: "Container Optimizer", text: "Container utilization 78% — below optimal level.", action: "Optimize now" },
  { sev: "success", agent: "Pricing Advisor", text: "Suggested +2.5% on Butane 12kg generated $4,210 extra margin.", action: "View" },
  { sev: "warning", agent: "Export Assistant", text: "2 shipments missing Certificate of Origin for Mauritania.", action: "Resolve" },
];

function AdminDashboard() {
  return (
    <div className="space-y-6 max-w-[1500px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations cockpit</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time intelligence across pricing, margins and shipments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue (MTD)" value={formatCurrency(1320000)} delta="+12.4%" hint="vs last month" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Orders" value="184" delta="+8" hint="this week" icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Avg margin" value="19.1%" delta="+0.7pt" hint="6-month high" icon={<TrendingUp className="h-4 w-4" />} intent="success" />
        <StatCard label="AI savings" value={formatCurrency(184200)} delta="+$28k" hint="this quarter" icon={<Sparkles className="h-4 w-4" />} intent="ai" />
      </div>

      {/* AI INSIGHTS — required block */}
      <div className="rounded-xl border-2 border-ai/30 bg-gradient-to-br from-card to-ai/5 p-5 shadow-ai">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AgentBadge name="AI Insights" />
            <h3 className="font-semibold">Live recommendations from your agents</h3>
          </div>
          <Link to="/admin/agents" className="text-xs text-ai hover:underline flex items-center gap-1">View all agents <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <div key={i} className="rounded-lg bg-card border border-border p-4 flex items-start gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${ins.sev === "warning" ? "bg-warning/15 text-warning" : ins.sev === "success" ? "bg-success/15 text-success" : "bg-ai/15 text-ai"}`}>
                {ins.sev === "warning" ? <AlertTriangle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ai">{ins.agent}</div>
                <p className="text-sm mt-0.5">{ins.text}</p>
                <button className="mt-2 text-xs font-medium text-primary hover:underline">{ins.action} →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Revenue & Margin trend</h3>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.42 0.18 255)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.42 0.18 255)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 245)" />
              <XAxis dataKey="month" stroke="oklch(0.5 0.04 250)" fontSize={11} />
              <YAxis stroke="oklch(0.5 0.04 250)" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.015 245)" }} />
              <Area type="monotone" dataKey="revenue" stroke="oklch(0.42 0.18 255)" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <h3 className="font-semibold mb-4">Revenue by country</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={countryPerformance} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 245)" horizontal={false} />
              <XAxis type="number" stroke="oklch(0.5 0.04 250)" fontSize={11} />
              <YAxis type="category" dataKey="country" stroke="oklch(0.5 0.04 250)" fontSize={11} width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.015 245)" }} />
              <Bar dataKey="revenue" fill="oklch(0.62 0.18 235)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Active agents</h3>
          <Link to="/admin/agents" className="text-xs text-primary hover:underline">Manage</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {agents.slice(0, 5).map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-elegant transition-smooth">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-lg bg-gradient-ai text-ai-foreground flex items-center justify-center"><a.icon className="h-4 w-4" /></div>
                <span className={`h-2 w-2 rounded-full ${a.status === "active" ? "bg-success animate-pulse" : a.status === "analyzing" ? "bg-ai animate-pulse" : "bg-muted-foreground/40"}`} />
              </div>
              <div className="mt-3 text-sm font-semibold">{a.name}</div>
              <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{a.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
