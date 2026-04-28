import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">La page que vous cherchez n'existe pas.</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-elegant">Retour à l'accueil</a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AKWA AI — Pricing, commandes & optimisation export intelligents" },
      { name: "description", content: "AKWA AI est une plateforme d'opérations export augmentée par IA — pricing dynamique, optimisation conteneur, intelligence de marge et copilotes douaniers." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}
