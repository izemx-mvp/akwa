# Remix of AKWA AI Navigator

Créer un prototype SaaS interactif et haut de gamme nommé “AKWA AI”.

🎯 OBJECTIF GLOBAL

AKWA AI est une plateforme intelligente de gestion des opérations export pour un groupe industriel (type AKWA Group).

La plateforme doit :

digitaliser les commandes clients (fin des emails)

optimiser le pricing

améliorer la rentabilité

optimiser le chargement des conteneurs

intégrer des agents IA métiers visibles et actifs

👉 IMPORTANT :
Les agents IA sont le cœur du produit.
Ils doivent apparaître comme des copilotes intelligents, pas comme des modules.

🧩 STRUCTURE GLOBALE

Créer 2 espaces distincts :

Portail Client

Back-office Admin avec agents IA

Langue UI : ANGLAIS
Design : SaaS premium, moderne, data-driven

🔐 PAGE LOGIN

Logo : AKWA AI

Tagline :
“Intelligent Export Pricing, Ordering & Optimization Platform”

2 accès :
→ Enter as Client
→ Enter as Admin

👤 PORTAIL CLIENT

OBJECTIF :
Permettre aux clients de commander directement sur la plateforme.

NAVIGATION :

Dashboard

Catalog

New Order

My Orders

Ask AKWA AI

📦 ÉCRAN : CREATE ORDER (IMPORTANT)

Inclure :

Produits (mock export)

Quantités

Destination

Prix dynamique

👉 AJOUT CRITIQUE :
Afficher un agent IA visible dans l’écran

Nom : AI Order Assistant

COMPORTEMENT :

apparaît comme un assistant latéral ou widget flottant

donne des suggestions en temps réel

EXEMPLES :

“You can increase quantity of Product X to reduce shipping cost”

“Current order is not optimized for container loading”

“Recommended alternative: Product Y for better margin”

L’agent doit :

réagir aux actions utilisateur

afficher des recommandations dynamiques

🧠 BACK-OFFICE ADMIN (PARTIE CLÉ)

OBJECTIF :
Créer un cockpit intelligent avec agents IA actifs.

NAVIGATION :

Dashboard

Orders

Pricing

Margins

Container Optimization

Export

AI Agents

Copilot

Settings

📊 DASHBOARD ADMIN

Inclure :

KPI

graphiques

👉 SECTION OBLIGATOIRE :
“AI Insights”

CONTENU :
Flux de recommandations venant des agents

Exemples :

“Margin in Côte d’Ivoire decreased by 4%”

“Container utilization below optimal level”

🤖 LOGIQUE DES AGENTS IA (TRÈS IMPORTANT)

Les agents doivent :

Avoir une IDENTITÉ :

nom

rôle

personnalité légère (assistant pro)

Être VISIBLES :

cartes

sidebar

notifications

suggestions

Être ACTIFS :

générer recommandations automatiquement

analyser données

intervenir dans les écrans

Être INTERACTIFS :

clickable

chat

suggestions actionnables

🤖 DÉTAIL COMPLET DES AGENTS

🔹 1. PRICING ADVISOR

OBJECTIF :
Optimiser les prix

APPARITION UI :

présent dans écran Pricing

panneau latéral intelligent

cartes de recommandations

COMPORTEMENT :

analyse les marges

détecte anomalies

propose nouveaux prix

EXEMPLES :

“Increase price by 2.5% for Senegal”

“Margin below target for Client X”

“Suggested optimal price: 125.50 USD”

INTERACTIONS :

bouton “Apply suggestion”

simulation

🔹 2. CONTAINER OPTIMIZER

OBJECTIF :
Optimiser le chargement des conteneurs

APPARITION UI :

intégré dans écran Container Optimization

visualisation graphique

COMPORTEMENT :

calcule remplissage

propose scénarios

EXEMPLES :

“Current load: 78%”

“Optimized load: 94%”

“Add 120 units of Product A”

INTERACTIONS :

switch entre scénarios

appliquer configuration

🔹 3. MARGIN ANALYST

OBJECTIF :
Analyser rentabilité

APPARITION UI :

dashboard marges

alertes visibles

COMPORTEMENT :

détecte clients non rentables

analyse tendances

EXEMPLES :

“Client Dakar Energy Supply margin dropped by 6%”

“Product X is underperforming”

INTERACTIONS :

drill-down

recommandations actionnables

🔹 4. EXPORT ASSISTANT

OBJECTIF :
Assister opérations export

APPARITION UI :

écran export

assistant latéral

COMPORTEMENT :

vérifie documents

suggère actions

EXEMPLES :

“Missing document for shipment”

“Check customs requirement for Mauritania”

🔹 5. INTERNAL COPILOT

OBJECTIF :
Interaction globale avec les données

APPARITION UI :

page dédiée type ChatGPT

COMPORTEMENT :

répond aux questions

analyse données en temps réel

EXEMPLES :

“Best client this month”

“How to improve margins in Mali”

“Optimize next shipment”

🧠 PAGE “AI AGENTS”

Créer une page dédiée où chaque agent est présenté comme :

une carte intelligente

avec :

nom

description

capacités

exemples

dernières actions

👉 IMPORTANT :
Donner un effet “agents vivants”
(montrer qu’ils travaillent)

📊 ÉCRANS MÉTIERS

Pricing :

tableau

simulation

agent actif

Margins :

analytics

alertes IA

Container :

optimisation visuelle

Orders :

workflow validation

🧪 MOCK DATA

Clients :

Atlantic Trade SARL

Dakar Energy Supply

Sahel Distribution

Pays :

Sénégal

Côte d’Ivoire

Mauritanie

Produits :

Butane Cylinder 12kg

Lubricant Pack XL

Fuel Additive Drum

Inclure :

prix réalistes

marges

volumes

🎨 DESIGN

moderne

premium

dashboards avancés

agents IA visibles (type copilots)

UX claire

🏁 OBJECTIF FINAL

Le prototype doit donner l’impression :

👉 d’un système intelligent piloté par IA
👉 d’un produit prêt à être vendu
👉 d’une plateforme où les agents prennent part aux décisions

Ce n’est PAS un ERP classique.
C’est une plateforme augmentée par des agents IA.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2bc3b962-9ea1-4b24-a65d-2cf52994aadd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
