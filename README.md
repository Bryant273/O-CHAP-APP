# O'CHAP — Hub Intelligent d'Électroménager et Logistique

Bienvenue sur le portail d'administration de la plateforme **O'CHAP**, la marketplace logistique et commerciale haut de gamme d'Afrique de l'Ouest et Centrale (Abidjan & Libreville), spécialisée dans le secteur de l'électroménager premium.

Cette application est un système de gestion complet de bout en bout qui relie de manière fluide les administrateurs, les fournisseurs régionaux et les clients, en combinant des alertes de stock en temps réel avec des outils décisionnels propulsés par l'Intelligence Artificielle (Gemini API).

---

## 🚀 Fonctionnalités Clés

### 📦 Gestion Complète de l'Inventaire (Abidjan / Libreville)
- **Suivi multicentrique** : Contrôle des niveaux de stock par zone géographique afin de prévenir les ruptures ou le surstockage.
- **Seuils d'alerte configurables** : Définition de niveaux minimaux pour déclencher automatiquement des actions de réapprovisionnement.
- **Calcul intelligent des marges** : Visualisation globale des taux de profitabilité des ventes par produit et catalogue.

### 💼 Relations Clients & Fournisseurs (CRM/SRM)
- **Double espace unifié** : Stockage enrichi des profils incluant des informations spécifiques telles que le solde des comptes partenaires, l'historique d'achat et le statut de fidélité.
- **Gestion des rôles (Rbac)** : Droits hiérarchisés séparant les Super-Admins, Administrateurs de zone, Fournisseurs et Clients finaux.

### 📊 Suivi Logistique et Commandes
- **Gestion des états de commande** : Progression en temps réel de "Reçu" à "Livré", avec comptabilisation instantanée du chiffre d'affaires.
- **Export Excel intégré** : Génération de tableaux de bord financiers et d'inventaire complets en un clic pour les audits physiques.

### 🧠 Modules IA Intégrés (Gemini v3)
Tous les traitements avec l'API Gemini sont sécurisés et proxyfiés sur un serveur Express backend :
1. **Générateur Marketing de Description** : Crée instantanément des fiches produits optimisées, adaptées au marché d'Abidjan et Libreville en un clic.
2. **Analyseur de Performance d'Inventaire** : Analyse les tendances de vente croisées avec les niveaux de stock actuels pour émettre des recommandations structurées en Markdown.
3. **Moteur d'Idées de Campagne** : Génère des structures de campagnes multi-canaux (SMS, push, emailing) basées sur la situation actuelle du stock.
4. **Tableau Analytics Avancé** : Synthétise la santé globale de l'entreprise (`excellent`, `stable`, `critical`), l'analyse des marges, les marques les plus porteuses et les tendances saisonnières africaines.

---

## 📂 Structure du Projet

L'architecture suit scrupuleusement les exigences des applications Angular hybrides modernes (Zoneless, SSR / Hydration, Express Middleware).

```
├── angular.json                     # Configuration de la CLI Angular et du compilateur dev-server
├── package.json                     # Dépendances et scripts de démarrage (Ng v21, Firebase, Tailwind v4)
├── tsconfig.json                    # Configuration générale de TypeScript
├── tsconfig.app.json                # Options de compilation TypeScript spécifiques à l'application
├── firebase-applet-config.json       # Identifiants de connexion et de base de données Firestore
├── firestore.rules                  # Regles de sécurité Firestore pour l'isolation des données
├── src/
│   ├── main.ts                      # Point d'entrée principal pour le bootstrap côté navigateur (SPA)
│   ├── main.server.ts               # Point d'entrée pour le bootstrap côté serveur (SSR avec BootstrapContext)
│   ├── server.ts                    # Serveur Express Node.js - Proxy local sécurisé pour Gemini API
│   ├── styles.css                   # Feuilles de style globales et configuration de thèmes Tailwind v4
│   ├── globals.d.ts                 # Déclarations des types globaux
│   ├── index.html                   # Squelette web HTML principal contenant la balise hôte <app-root>
│   └── app/
│       ├── app.ts                   # Composant racine Angular ordonnant les routes et la mise en page
│       ├── app.html                 # Template principal (structure d'entête globale et espace router-outlet)
│       ├── app.css                  # Styles spécifiques de haut niveau
│       ├── app.config.ts            # Configuration des providers côté client (Zoneless, Routing, Hydration)
│       ├── app.config.server.ts     # Configuration des providers côté serveur (SSR)
│       ├── app.routes.ts            # Définition des routes et de la navigation interne
│       └── services/
│           ├── auth.service.ts      # Gestion de l'état d'authentification utilisateur via Firebase Auth
│           ├── data.service.ts      # Gestion des collections Firestore (Real-time snapshots en CSR, no-ops en SSR)
│           └── firebase.ts          # Initialisation et configuration d'accès robuste de l'app Firebase
```

---

## 🔧 Technologies & Stack

- **Framework Front-end** : [Angular v21](https://angular.dev/) (Zoneless avec l'usage exclusif de Signals pour la réactivité, Control Flow `@if/@for`, Architecture Standalone).
- **Moteur CSS** : [Tailwind CSS v4](https://tailwindcss.com/) (Syntaxe d'import moderne `@import "tailwindcss";`, gestion de thèmes typographiques native).
- **Backend d'authentification et Stockage** : Firebase Firestore et Firebase Authentication (avec le mode d'interrogation Long-polling activé pour éliminer les déconnexions intempestives en sandboxing).
- **Serveur API et Rendu SSR** : Express.js servant le rendu côté serveur (SSR) de manière transparente sur le port `3000` et encapsulant les clés privées (Gemini API Secret Key).

---

## 🛠️ Configuration de l'environnement

Pour exécuter toutes les fonctionnalités intelligentes (recommandations d'inventaire, d'analytics et génération automatique de textes commerciaux) :

1. Déclarez votre variable dans le fichier d'environnement ou configurez-la dans les secrets de l'interface Google AI Studio :
   ```env
   GEMINI_API_KEY=votre_cle_gemini_active
   ```
2. Si la clé est absente, l'application s'initialisera automatiquement dans un mode **Démo sécurisé** pour préserver la stabilité globale de l'expérience et continuer de simuler parfaitement le comportement.
