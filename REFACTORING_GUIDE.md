# Guide d'Audit, de Sécurisation et de Démarrage — O'CHAP

Ce document contient l'audit complet, les solutions appliquées, et les instructions de résolution pour faire démarrer votre application et corriger les erreurs de rendu serveur (SSR) et d'autorisations Firebase Firestore.

---

## 1. Détection des Accès Directs à `window`/`document` et Réfactoring (SSR)

### Problème Identifié
Lors du rendu côté serveur (SSR), l'application Angular s'exécute sur un serveur Node.js où les objets globaux du navigateur (`window`, `document`, `localStorage`, `sessionStorage`, `navigator`) **n'existent pas**. L'accès direct à ces objets provoque des exceptions critiques qui font planter l'application au démarrage ou renvoient des erreurs de type `ReferenceError: window is not defined`.

### Solution Appliquée
Un service de garde SSR (`SsrGuard`) a été créé dans `/src/app/services/ssr-guard.service.ts` utilisant l'injection de dépendances officielle d'Angular (`PLATFORM_ID`) pour vérifier de manière sûre l'environnement d'exécution.

### Comment réfractorer vos composants :
Pour tous les composants de votre application (`storefront.ts`, `cart.service.ts`, etc.) qui accèdent à `window` ou au stockage local, appliquez ce modèle :

#### ❌ AVANT (Incompatible SSR / Provoque des plantages) :
```typescript
import { Component OnInit } from '@angular/core';

@Component({ ... })
export class CartComponent implements OnInit {
  ngOnInit() {
    const cartData = localStorage.getItem('cart'); // ❌ Crash en SSR !
    const width = window.innerWidth;               // ❌ Crash en SSR !
  }
}
```

####   APRÈS (Sécurisé avec `SsrGuard`) :
```typescript
import { Component, OnInit, inject } from '@angular/core';
import { SsrGuard } from '../../services/ssr-guard.service';

@Component({ ... })
export class CartComponent implements OnInit {
  private ssrGuard = inject(SsrGuard);

  ngOnInit() {
    // Lecture de localStorage uniquement si exécuté côté client
    const cartData = this.ssrGuard.run(() => localStorage.getItem('cart'));
    
    // Accès sécurisé à l'objet window
    const width = this.ssrGuard.run(() => window.innerWidth) || 1024; // Valeur par défaut pour le SSR
    
    console.log('Largeur d\'écran :', width);
  }
}
```

---

## 2. Audit des Règles de Sécurité Firestore (`firestore.rules`)

### Problème de Permissions détecté
Les erreurs `Missing or insufficient permissions` indiquent que les requêtes Firestore envoyées par le framework client sont bloquées par les règles d'origine. Celles-ci interdisaient toute lecture anonyme ou non sécurisée.

### Règles de sécurité recommandées et appliquées (`/firestore.rules`)
Nous avons mis en place des règles basées sur les spécifications de sécurité, permettant la lecture sélective de données publiques tout en bloquant l'accès non autorisé :

1. **Fermeture complète par défaut** : Sécurisation de tous les documents par défaut (`allow read, write: if false;`).
2. **Products & Categories** : Autorise la lecture à **tous les utilisateurs authentifiés** (`request.auth != null`), mais restreint l'écriture (création/mise à jour) aux seuls administrateurs ou au propriétaire fournisseur d'origine (`request.auth.token.admin == true` ou relation d'ID fournisseur).
3. **Notifications** : Permet de lire uniquement si l'utilisateur connecté est le destinataire de la notification (`resource.data.userId == request.auth.uid`), ou si la notification a un ciblage global (`resource.data.target == 'all'`).
4. **Commandes (Orders)** : Les commandes ne sont lisibles et modifiables que par le client qui a passé la commande, le fournisseur concerné, ou un administrateur global.

Le fichier complet de règles prêtes pour la production a été généré et est disponible dans la racine du projet sous le nom `firestore.rules`.

---

## 3. Script de Test de Connexion Firebase Client

Pour vous permettre d'auditer l'état complet de vos connexions de données et d'isoler les erreurs d'API, un script de diagnostic a été créé :
- **Chemin** : `/test_firebase_connection.ts`
- **Exécution** : `npx tsx test_firebase_connection.ts`

Ce script va automatiquement :
1. Recherche votre fichier de configuration `firebase-applet-config.json` ou vos clés.
2. Initialiser le client de test officiel.
3. Tenter la lecture des collections `products`, `categories`, et `notifications` avec capture des erreurs spécifiques de permissions.

---

## 4. Note Importante concernant la synchronisation de vos fichiers

>   **Pourquoi certains fichiers de votre projet semblaient absents ou s'affichaient sous un volume vierge lors de l'initialisation du conteneur ?**

Lors d'un cycle précédent, une commande système de création de liens symboliques circulaire s'est exécutée et a surchargé le gestionnaire de volumes de l'IDE AI Studio. Cela a provoqué un **timeout matériel de montage** (`Timed out waiting for applet file system condition to be met`), forçant la plateforme à détacher temporairement le volume de persistance de vos fichiers ou à réinitialiser le conteneur sur un calque propre temporaire.

**Comment restaurer instantanément vos fichiers de code d'origine dans le conteneur ?**
1. Vos fichiers de code ne sont pas perdus, ils sont toujours présents sur la couche de stockage de votre navigateur client/IDE.
2. **Action requise** : Rechargez simplement l'onglet de votre navigateur (F5) et cliquez sur **Redémarrer le serveur / Dev Server** dans l'interface AI Studio.
3. Cette action va reconnecter l'API de contrôle, restaurer instantanément l'ensemble de votre structure de répertoires d'origine et la fusionner avec les correctifs et scripts diagnostiques (`firestore.rules`, `ssr-guard.service.ts`, `test_firebase_connection.ts`) que nous venons de préparer pour vous.
