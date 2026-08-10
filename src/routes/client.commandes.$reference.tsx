import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderHeader } from "@/components/order/OrderHeader";
import { TabOverview } from "@/components/order/TabOverview";
import { TabArticles } from "@/components/order/TabArticles";
import { LogisticsTimeline, ReadinessCard, ShippingCard, QualityCard } from "@/components/order/TabLogistique";
import { TabConteneurs } from "@/components/order/TabConteneurs";
import { TabDocuments } from "@/components/order/TabDocuments";
import { TabPaiements } from "@/components/order/TabPaiements";
import { TabEchanges } from "@/components/order/TabEchanges";
import { TabHistorique } from "@/components/order/TabHistorique";
import { useExportOrderView } from "@/lib/order-variants";
import { OrderQuoteCard } from "@/components/quote/OrderQuoteCard";

export const Route = createFileRoute("/client/commandes/$reference")({
  head: () => ({
    meta: [
      { title: "Suivi de commande export — Portail client AKWA" },
      { name: "description", content: "Cockpit de suivi d'une commande export AKWA : progression, conteneurs, documents, paiements et échanges." },
      { property: "og:title", content: "Suivi de commande export — Portail client AKWA" },
      { property: "og:description", content: "Suivez en temps réel votre commande export AKWA : logistique, documents, paiements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderCockpit,
});

const TABS = [
  ["overview", "Vue d'ensemble"],
  ["articles", "Articles"],
  ["logistique", "Logistique"],
  ["conteneurs", "Conteneurs"],
  ["documents", "Documents"],
  ["paiements", "Paiements"],
  ["echanges", "Échanges"],
  ["historique", "Historique"],
] as const;

function OrderCockpit() {
  const { reference } = Route.useParams();
  const order = useExportOrderView(reference);
  const [tab, setTab] = useState<string>("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  const goTab = (t: string) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="max-w-[1500px] space-y-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] space-y-4">
      <OrderHeader order={order} onGoTab={goTab} />
      <OrderQuoteCard orderRef={reference} />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="sticky top-0 z-20 -mx-1 bg-background/85 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
            {TABS.map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4"><TabOverview order={order} onGoTab={goTab} /></TabsContent>
        <TabsContent value="articles" className="mt-4"><TabArticles order={order} /></TabsContent>
        <TabsContent value="logistique" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <LogisticsTimeline order={order} />
            <div className="space-y-4">
              <ReadinessCard order={order} />
              <QualityCard order={order} />
            </div>
            <div className="lg:col-span-2"><ShippingCard order={order} /></div>
          </div>
        </TabsContent>
        <TabsContent value="conteneurs" className="mt-4"><TabConteneurs order={order} /></TabsContent>
        <TabsContent value="documents" className="mt-4"><TabDocuments order={order} /></TabsContent>
        <TabsContent value="paiements" className="mt-4"><TabPaiements order={order} /></TabsContent>
        <TabsContent value="echanges" className="mt-4"><TabEchanges order={order} /></TabsContent>
        <TabsContent value="historique" className="mt-4"><TabHistorique order={order} /></TabsContent>
      </Tabs>
    </div>
  );
}
