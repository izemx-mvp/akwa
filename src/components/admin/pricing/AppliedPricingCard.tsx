import { Link } from "@tanstack/react-router";
import { Chip, Panel } from "@/components/admin/ui";
import { eur2, pct, useBackoffice } from "@/lib/backoffice-store";
import { orderContext, useAgentHub } from "@/lib/agent-hub";
import { resolvePrice, usePricing } from "@/lib/pricing-rules";

/** Tarification appliquée : prix catalogue → règles tarifaires → prix applicable (base du devis). */
export function AppliedPricingCard({ compact = false }: { compact?: boolean }) {
  useAgentHub();
  usePricing();
  const { products, clients } = useBackoffice();
  const ctx = orderContext();
  const order = ctx.order;
  const client = clients.find((c) => c.id === order?.clientId);
  if (!order) return null;

  const rows = order.items.slice(0, compact ? 4 : 12).map((i) => {
    const product = products.find((p) => p.ref === i.ref);
    const res = product
      ? resolvePrice({ product, client, quantity: i.quantity, orderAmount: order.items.reduce((s, x) => s + x.quantity * x.unitPrice, 0), destination: order.destination, incoterm: order.incoterm })
      : null;
    return { i, res };
  });

  const totalCatalog = rows.reduce((s, r) => s + (r.res?.catalogPrice ?? r.i.unitPrice) * r.i.quantity, 0);
  const totalApplicable = rows.reduce((s, r) => s + (r.res?.applicablePrice ?? r.i.unitPrice) * r.i.quantity, 0);

  return (
    <Panel
      title="Tarification appliquée"
      description={`Prix catalogue → règles tarifaires actives → prix applicable (base du devis) — ${order.reference}`}
      action={<Link to="/admin/agents/pricing/regles" className="text-xs font-medium text-primary hover:underline">Voir les règles →</Link>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Article</th>
              <th className="px-3 py-2 text-right font-medium">Prix catalogue</th>
              <th className="px-3 py-2 text-left font-medium">Règle tarifaire</th>
              <th className="px-3 py-2 text-right font-medium">Réduction</th>
              <th className="px-3 py-2 text-right font-medium">Prix applicable</th>
              <th className="px-3 py-2 text-right font-medium">Marge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ i, res }) => {
              const delta = res && res.catalogPrice ? ((res.applicablePrice - res.catalogPrice) / res.catalogPrice) * 100 : 0;
              return (
                <tr key={i.ref}>
                  <td className="px-3 py-2"><div className="font-medium">{i.label}</div><div className="text-[11px] text-muted-foreground">{i.ref} · {i.quantity} {i.unit}</div></td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{eur2(res?.catalogPrice ?? i.unitPrice)}</td>
                  <td className="px-3 py-2 text-xs">
                    {res?.applied.length ? <Chip tone="ai">{res.applied[0].rule.name}</Chip> : <span className="text-muted-foreground">Aucune</span>}
                  </td>
                  <td className={`px-3 py-2 text-right ${delta < 0 ? "text-success" : delta > 0 ? "text-warning" : "text-muted-foreground"}`}>
                    {delta ? `${delta.toFixed(1).replace(".", ",")} %` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-ai">{eur2(res?.applicablePrice ?? i.unitPrice)}</td>
                  <td className="px-3 py-2 text-right">
                    <Chip tone={(res?.marginPct ?? 0) >= 20 ? "success" : (res?.marginPct ?? 0) >= 15 ? "warning" : "danger"}>{pct(res?.marginPct ?? 0)}</Chip>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border text-sm">
              <td className="px-3 py-2 font-semibold">Total marchandises</td>
              <td className="px-3 py-2 text-right text-muted-foreground">{eur2(totalCatalog)}</td>
              <td colSpan={2} />
              <td className="px-3 py-2 text-right font-bold text-ai">{eur2(totalApplicable)}</td>
              <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                {totalCatalog ? `${(((totalApplicable - totalCatalog) / totalCatalog) * 100).toFixed(1).replace(".", ",")} %` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Le devis part du prix applicable. Toute modification manuelle du prix dans l'Agent Devis est tracée dans l'audit tarifaire.
      </p>
    </Panel>
  );
}
