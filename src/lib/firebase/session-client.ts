"use client";

import "client-only";

import { signOut, type User } from "firebase/auth";
import { firebaseAuth } from "./client";

export class ServerSessionExchangeError extends Error {
  constructor() {
    super("Unable to complete the secure session request.");
    this.name = "ServerSessionExchangeError";
  }
}

async function postAuthRequest(path: string, body: Record<string, never> | { idToken: string }) {
  let response: Response;

  try {
    response = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Trainoryx-CSRF": "1",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ServerSessionExchangeError();
  }

  if (!response.ok) throw new ServerSessionExchangeError();
}

export async function establishServerSession(user: User): Promise<void> {
  let idToken: string;

  try {
    idToken = await user.getIdToken(true);
  } catch {
    throw new ServerSessionExchangeError();
  }

  await postAuthRequest("/api/auth/session", { idToken });

  try {
    await signOut(firebaseAuth);
  } catch {
    throw new ServerSessionExchangeError();
  }
}

export async function endServerSession(): Promise<void> {
  await postAuthRequest("/api/auth/logout", {});

  try {
    await signOut(firebaseAuth);
  } catch {
    throw new ServerSessionExchangeError();
  }
}
