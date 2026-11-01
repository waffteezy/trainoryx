"use client";

import "client-only";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

const missingVariables = Object.entries(firebaseConfig)
  .filter(([, value]) => !value?.trim())
  .map(([key]) => {
    switch (key) {
      case "apiKey":
        return "NEXT_PUBLIC_FIREBASE_API_KEY";
      case "authDomain":
        return "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN";
      case "projectId":
        return "NEXT_PUBLIC_FIREBASE_PROJECT_ID";
      case "appId":
        return "NEXT_PUBLIC_FIREBASE_APP_ID";
      case "messagingSenderId":
        return "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID";
    }
  });

if (missingVariables.length > 0) {
  throw new Error(
    `Missing Firebase client configuration: ${missingVariables.join(", ")}.`,
  );
}

const appConfig = {
  apiKey: firebaseConfig.apiKey!,
  authDomain: firebaseConfig.authDomain!,
  projectId: firebaseConfig.projectId!,
  appId: firebaseConfig.appId!,
  messagingSenderId: firebaseConfig.messagingSenderId!,
};

export const firebaseApp = getApps().some((app) => app.name === "[DEFAULT]")
  ? getApp()
  : initializeApp(appConfig);

export const firebaseAuth = getAuth(firebaseApp);
