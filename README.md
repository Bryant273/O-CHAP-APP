# O'CHAP — Hub Intelligent d'Électroménager et Logistique (Côte d'Ivoire)

Bienvenue sur le portail d'administration et d'exploitation de la plateforme **O'CHAP**, la marketplace logistique et commerciale premium de Côte d'Ivoire (Abidjan), spécialisée dans le secteur de l'électroménager de luxe et professionnel.

Cette application est un système ERP et e-commerce complet de bout en bout qui relie de manière fluide les administrateurs de la centrale, les fournisseurs de matériel électroménager et les clients ivoiriens. Elle combine des alertes de stock en temps réel avec des outils décisionnels avancés propulsés par l'Intelligence Artificielle de Google (Gemini API).

---

## 🚀 Fonctionnalités Clés

### 📦 Gestion Centralisée de l'Inventaire (Abidjan)
- **Suivi d'entrepôt localisé** : Contrôle rigoureux et en temps réel des niveaux de stock basés à Abidjan afin de prévenir les ruptures et d'automatiser le réapprovisionnement.
- **Seuils d'alarme configurables** : Personnalisation de seuils critiques de stock par article pour alerter instantanément les gestionnaires.
- **Calculateur de rentabilité** : Visualisation globale et par produit des marges et des bénéfices générés pour optimiser la politique tarifaire.

### 💼 CRM/SRM & Authentification Sécurisée
- **Double espace utilisateur** : Stockage enrichi des profils incluant l'historique d'achat, les adresses de livraison à Abidjan et le statut de fidélité.
- **Contrôle d'accès basé sur les rôles (RBAC)** : Permissions hiérarchisées protégeant les interfaces d'administration, de gestion de stock pour les fournisseurs et de commande pour les clients (rôles : `admin`, `manager_erp`, `fournisseur`, `livreur`, `client`).

### 📊 Suivi Logistique et Suivi des Commandes
- **Workflow des commandes** : Transition transparente des transactions (Reçu, Préparé, Transit, Livré) avec mise à jour automatisée de la comptabilité interne et des niveaux de stock.
- **Export de rapports financiers** : Génération de tableaux de bord financiers et opérationnels pour simplifier les inventaires physiques de fin de mois.

### 🧠 Décisions Stratégiques Assistées par l'IA (Gemini v3)
Tous les appels à l'intelligence artificielle sont sécurisés et proxyfiés au niveau du serveur Express backend pour ne jamais exposer d'informations sensibles au navigateur :
1. **Générateur Marketing de Description** : Conçoit instantanément des fiches descriptives percutantes et adaptées aux spécificités et exigences du marché d'Abidjan.
2. **Analyseur de Performance d'Inventaire** : Analyse les tendances de ventes consolidées avec les niveaux de stock actuels pour émettre des recommandations d'achats stratégiques.
3. **Moteur d'Idées de Campagne** : Alerte sur les invendus et propose des idées de campagnes d'activation multicanaux (SMS, push, email).
4. **Tableau Analytics Avancé** : Synthétise instantanément l'indice de santé de l'activité (`excellent`, `stable`, `critical`), détaille l'efficacité des marges, met en avant les marques les plus porteuses et formule des conseils saisonniers spécifiques à la Côte d'Ivoire.

---

## 📂 Structure du Projet

L'architecture du projet respecte les normes de développement de pointe d'Angular v21 (Zoneless, Rendu SSR Hybride, Express Middleware) :

```text
├── angular.json                     # Configuration de la CLI Angular et du build package
├── package.json                     # Dépendances et scripts NPM (Angular 21+, Firebase, Tailwind v4)
├── tsconfig.json                    # Configuration globale du compilateur TypeScript
├── firebase-applet-config.json       # Identifiants de connexion à l'infrastructure Firestore
├── firestore.rules                  # Règles de sécurité Firestore de production
├── src/
│   ├── main.ts                      # Point d'entrée principal pour l'exécution côté client (Navigateur)
│   ├── main.server.ts               # Point d'entrée pour l'exécution côté serveur (SSR avec BootstrapContext)
│   ├── server.ts                    # Serveur d'API Express et intégration du rendu SSR (Port 3000)
│   ├── styles.css                   # Styles globaux et variables de thème esthétiques Tailwind CSS v4
│   ├── globals.d.ts                 # Déclarations globales de types
│   ├── index.html                   # Squelette HTML principal
│   └── app/
│       ├── app.ts                   # Composant racine de l'application
│       ├── app.html                 # Gabarit HTML principal (barre de navigation, router-outlet)
│       ├── app.config.ts            # Configuration des modules et services sur le client (Zoneless, Router)
│       ├── app.config.server.ts     # Configuration de la couche de rendu sur le serveur
│       ├── app.routes.ts            # Définition des écrans de l'application et sécurisation (guards)
│       └── services/
│           ├── auth.service.ts      # Gestion de session et d'identité via Firebase Authentication
│           ├── data.service.ts      # Gestion des collections et flux temps réel Firestore
│           └── firebase.ts          # Module d'initialisation de Firebase avec correctifs SSR
```

---

## 🌐 Exposition de l'API Backend

Pour garantir une sécurité maximale (Zero Trust côté client), toutes les requêtes demandant une clé secrète transitent par le serveur Express s'exécutant sur le port **3000**.

### Points d'Accès d'API Sécurisés (`/api/*`)

1. **Génération de campagnes marketing** :
   - **Route** : `POST /api/ai/marketing`
   - **Corps de requête** :
     ```json
     {
       "shortageCount": 2,
       "promoCount": 5
     }
     ```
   - **Réponse attendue** : Un tableau JSON contenant les objets de campagnes structurés :
     ```json
     [
       {
         "title": "Campagne...",
         "subject": "...",
         "message": "...",
         "channel": "Email"
       }
     ]
     ```

2. **Génération d'analyses décisionnelles** :
   - **Route** : `POST /api/ai/analytics`
   - **Corps de requête** :
     ```json
     {
       "products": [...],
       "ordersCount": 12
     }
     ```
   - **Réponse attendue** : Un rapport analytique structuré en JSON :
     ```json
     {
       "globalHealth": "stable",
       "profitAnalysis": "...",
       "topPerformingBrands": ["Samsung", "LG"],
       "seasonalInsights": "...",
       "stockAlerts": [...]
     }
     ```

---

## ⚙️ Configuration Restreinte des Clés et Secrets

### Variables d'Environnement (`.env.example`)
La clé d'API Gemini n'est jamais exposée sur le réseau public ou injectée dans les fichiers statiques du navigateur.

```env
# Clé d'API secrète de Google Gemini (gérée côté serveur de manière sécurisée)
GEMINI_API_KEY=AIzaSy********************************

# Identifiants de connexion Firebase (gérés de manière transparente)
FIREBASE_CONFIG_PATH=firebase-applet-config.json
```

*Remarque : Si aucune clé `GEMINI_API_KEY` n'est configurée, l'API Express bascule automatiquement et de manière transparente sur un mode de démonstration robuste. Cela garantit que la plateforme reste entièrement fonctionnelle et opérationnelle pour les démonstrations de flux sans risque d'erreur ou d'arrêt.*
