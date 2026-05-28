/**
 * Script de test pour vérifier la connexion Firebase et la lecture de données.
 * Pour exécuter ce fichier : npx tsx test_firebase_connection.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Recherche du fichier de configuration Firebase
const configPaths = [
  path.join(__dirname, 'firebase-applet-config.json'),
  path.join(__dirname, 'src', 'firebase-applet-config.json'),
  path.join(__dirname, '.dev.env.json')
];

let firebaseConfig: any = null;

for (const configPath of configPaths) {
  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      // Si c'est le fichier complet firebase-applet-config
      if (data.firebaseProjectConfig) {
        firebaseConfig = data.firebaseProjectConfig;
        console.log(`[SUCCÈS] Configuration lue depuis : ${configPath}`);
        break;
      } else if (data.apiKey && data.authDomain) {
        firebaseConfig = data;
        console.log(`[SUCCÈS] Configuration lue depuis : ${configPath}`);
        break;
      }
    } catch (e: any) {
      console.error(`[ERREUR] Impossible de lire ${configPath}:`, e.message);
    }
  }
}

if (!firebaseConfig) {
  console.log('[INFO] Aucun fichier de configuration trouvé, utilisation des variables d\'environnement par défaut si disponibles.');
  firebaseConfig = {
    apiKey: process.env['FIREBASE_API_KEY'] || "MOCK_API_KEY_CHECK_CONFIG",
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'],
    projectId: process.env['FIREBASE_PROJECT_ID'],
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'],
    appId: process.env['FIREBASE_APP_ID']
  };
}

// Initialisation de l'application Firebase
try {
  console.log('[INFO] Initialisation de Firebase avec le projet :', firebaseConfig.projectId);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  console.log('[SUCCÈS] Firebase initialisé avec succès !');

  // Test de lecture des collections
  const testCollections = ['products', 'categories', 'notifications'];

  async function testRead() {
    console.log('\n--- Début des tests de lecture de données ---');
    for (const colName of testCollections) {
      try {
        console.log(`[TEST] Lecture de la collection '${colName}'...`);
        const colRef = collection(db, colName);
        const q = query(colRef, limit(3));
        const querySnapshot = await getDocs(q);
        
        console.log(`[SUCCÈS] ${querySnapshot.size} documents récupérés dans la collection '${colName}'.`);
        querySnapshot.forEach((doc) => {
          console.log(`  - Document ID: ${doc.id}, Données (tronquées):`, JSON.stringify(doc.data()).substring(0, 100) + '...');
        });
      } catch (err: any) {
        if (err.message && err.message.includes('permission-denied')) {
          console.error(`[AVERTISSEMENT] Erreur d'accès à '${colName}' : Missing or insufficient permissions.`);
          console.error(` => Cause probable : Les règles de sécurité Firestore de 'firestore.rules' imposent une authentification utilisateur.`);
        } else {
          console.error(`[ERREUR] Erreur de lecture pour '${colName}' :`, err.message || err);
        }
      }
    }
    console.log('--- Fin des tests ---');
  }

  testRead();

} catch (error: any) {
  console.error('[FATAL] Échec lors de l\'initialisation de Firebase :', error.message || error);
}
