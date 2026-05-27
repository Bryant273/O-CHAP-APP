import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

import firebaseConfig from '../../../firebase-applet-config.json';

// Detailed diagnostic logging for Node vs Browser environment
const isBrowser = typeof window !== 'undefined';
console.log(`[O'CHAP / Firebase Init] Environment Diagnostic: isBrowser=${isBrowser}, hasProcess=${typeof process !== 'undefined'}, hasWindow=${isBrowser}`);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  console.log("[O'CHAP / Firebase Init] Starting Firebase app initialization...");
  app = initializeApp(firebaseConfig);
  console.log("[O'CHAP / Firebase Init] Firebase app successfully initialized.");
} catch (error) {
  console.error("[O'CHAP / Firebase Init] CRITICAL: Failed to initialize Firebase app!", error);
  // Fallback to avoid complete crash during bootstrap if config is invalid
  app = {} as FirebaseApp;
}

try {
  auth = getAuth(app);
} catch (error) {
  console.error("[O'CHAP / Firebase Init] Failed to initialize Firebase Auth!", error);
  auth = {} as Auth;
}

try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
  console.log("[O'CHAP / Firebase Init] Firestore initialized successfully with long polling.");
} catch (error) {
  console.error("[O'CHAP / Firebase Init] Failed to initialize Firestore!", error);
  db = {} as Firestore;
}

async function testConnection() {
  try {
    console.log("[O'CHAP / Firebase Init] Testing Firestore connection to database...");
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[O'CHAP / Firebase Init] Connection test completed.");
  } catch (error) {
    console.error("[O'CHAP / Firebase Init] Firestore connection error/warning:", error);
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[O'CHAP / Firebase Init] Firebase configuration might be offline or incorrect.");
    }
  }
}

if (isBrowser) {
  testConnection();
}

export { app, auth, db };
export default app;
