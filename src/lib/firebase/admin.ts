import "server-only";

import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const ADMIN_APP_NAME = "trainoryx-admin";

let firebaseAdminApp: App | undefined;
let firebaseAdminAuth: Auth | undefined;

function loadServiceAccount(): ServiceAccount {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

  if (!configuredPath) {
    throw new Error(
      "Firebase Admin is not configured: FIREBASE_SERVICE_ACCOUNT_PATH is missing.",
    );
  }

  const serviceAccountPath = isAbsolute(configuredPath)
    ? configuredPath
    : resolve(/* turbopackIgnore: true */ process.cwd(), configuredPath);

  let fileContents: string;

  try {
    fileContents = readFileSync(serviceAccountPath, "utf8");
  } catch {
    throw new Error(
      "Unable to read the Firebase Admin service account file. Check FIREBASE_SERVICE_ACCOUNT_PATH and file permissions.",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(fileContents);
  } catch {
    throw new Error("The Firebase Admin service account file is not valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      "The Firebase Admin service account JSON must contain an object.",
    );
  }

  const serviceAccountFile = parsed as Record<string, unknown>;
  const projectId =
    typeof serviceAccountFile.project_id === "string"
      ? serviceAccountFile.project_id.trim()
      : "";
  const clientEmail =
    typeof serviceAccountFile.client_email === "string"
      ? serviceAccountFile.client_email.trim()
      : "";
  const privateKey =
    typeof serviceAccountFile.private_key === "string"
      ? serviceAccountFile.private_key.trim()
      : "";
  const missingFields = [
    ["project_id", projectId],
    ["client_email", clientEmail],
    ["private_key", privateKey],
  ]
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    throw new Error(
      `Firebase Admin service account JSON is missing required fields: ${missingFields.join(", ")}.`,
    );
  }

  return { projectId, clientEmail, privateKey };
}

export function getFirebaseAdminApp(): App {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const serviceAccount = loadServiceAccount();
  const existingApp = getApps().find((app) => app.name === ADMIN_APP_NAME);

  if (existingApp) {
    if (
      !existingApp.options.credential ||
      existingApp.options.projectId !== serviceAccount.projectId
    ) {
      throw new Error(
        `A conflicting Firebase Admin app named "${ADMIN_APP_NAME}" is already initialized.`,
      );
    }

    firebaseAdminApp = existingApp;
    return firebaseAdminApp;
  }

  firebaseAdminApp = initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    },
    ADMIN_APP_NAME,
  );

  return firebaseAdminApp;
}

export function getFirebaseAdminAuth(): Auth {
  if (!firebaseAdminAuth) {
    firebaseAdminAuth = getAuth(getFirebaseAdminApp());
  }

  return firebaseAdminAuth;
}
