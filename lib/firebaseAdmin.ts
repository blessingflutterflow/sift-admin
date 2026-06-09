import fs from "fs";
import path from "path";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Service account credentials: in production (Vercel) from the
// FIREBASE_SERVICE_ACCOUNT env var (the full JSON); in local dev from the
// gitignored serviceAccountKey.json file. The Admin SDK bypasses Firestore
// security rules, which is what lets the dashboard read/flip statuses.
function loadServiceAccount(): Record<string, unknown> {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (fromEnv && fromEnv.trim().length > 0) {
    return JSON.parse(fromEnv);
  }
  const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
  return JSON.parse(fs.readFileSync(keyPath, "utf8"));
}

function adminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];
  return initializeApp({ credential: cert(loadServiceAccount()) });
}

/** Lazily resolve Firestore — defers reading the key file to request time. */
export function getAdminDb() {
  return getFirestore(adminApp());
}
