import { z } from "zod";

export const SESSION_COOKIE_NAME = "trainoryx_session";
export const SESSION_LIFETIME_SECONDS = 5 * 24 * 60 * 60;
export const SESSION_LIFETIME_MS = SESSION_LIFETIME_SECONDS * 1000;

const SESSION_REQUEST_HEADER = "x-trainoryx-csrf";
const SESSION_REQUEST_VALUE = "1";
const sessionRequestSchema = z
  .object({ idToken: z.string().trim().min(1).max(8192) })
  .strict();
const logoutRequestSchema = z.object({}).strict();

export type VerifiedTokenClaims = {
  uid?: unknown;
  email_verified?: unknown;
  auth_time?: unknown;
  name?: unknown;
};

export type FirebaseCoachProfile = {
  uid: string;
  email?: string | null;
  emailVerified: boolean;
  displayName?: string | null;
};

export type CoachIdentity = {
  firebaseUid: string;
  email: string;
  displayName: string;
};

export type SessionPostDependencies = {
  verifyIdToken: (
    idToken: string,
    checkRevoked: true,
  ) => Promise<VerifiedTokenClaims>;
  getFirebaseUser: (uid: string) => Promise<FirebaseCoachProfile>;
  provisionCoach: (identity: CoachIdentity) => Promise<unknown>;
  createSessionCookie: (
    idToken: string,
    options: { expiresIn: number },
  ) => Promise<string>;
  nowSeconds?: () => number;
  secureCookies?: boolean;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  headers?: HeadersInit,
) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("cache-control", "no-store");
  return Response.json(body, { status, headers: responseHeaders });
}

function getExpectedOrigin(request: Request): string | null {
  try {
    const origin = new URL(request.url).origin;
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

export function isSameOriginMutation(request: Request): boolean {
  const originHeader = request.headers.get("origin");
  const expectedOrigin = getExpectedOrigin(request);

  if (!originHeader || originHeader === "null" || !expectedOrigin) return false;

  try {
    const origin = new URL(originHeader);
    if (origin.origin !== originHeader || origin.username || origin.password) {
      return false;
    }

    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite && fetchSite !== "same-origin") return false;

    return origin.origin === expectedOrigin;
  } catch {
    return false;
  }
}

function isJsonRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type");
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

function validateMutationRequest(request: Request): Response | null {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, { allow: "POST" });
  }

  if (!isSameOriginMutation(request)) {
    return jsonResponse({ error: "Request rejected." }, 403);
  }

  if (request.headers.get(SESSION_REQUEST_HEADER) !== SESSION_REQUEST_VALUE) {
    return jsonResponse({ error: "Request rejected." }, 403);
  }

  if (!isJsonRequest(request)) {
    return jsonResponse({ error: "Unsupported request format." }, 415);
  }

  return null;
}

function serializeSessionCookie(value: string, secure: boolean): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Max-Age=${SESSION_LIFETIME_SECONDS}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

function serializeClearedSessionCookie(secure: boolean): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

function hasRecentSignIn(authTime: unknown, nowSeconds: number): authTime is number {
  return (
    typeof authTime === "number" &&
    Number.isSafeInteger(authTime) &&
    authTime <= nowSeconds &&
    nowSeconds - authTime <= 5 * 60
  );
}

export function createSessionPostHandler(dependencies: SessionPostDependencies) {
  return async function handleSessionPost(request: Request): Promise<Response> {
    const invalidRequest = validateMutationRequest(request);
    if (invalidRequest) return invalidRequest;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid request." }, 400);
    }

    const parsedBody = sessionRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return jsonResponse({ error: "Invalid request." }, 400);
    }

    let claims: VerifiedTokenClaims;
    try {
      claims = await dependencies.verifyIdToken(parsedBody.data.idToken, true);
    } catch {
      return jsonResponse({ error: "Unable to authenticate this request." }, 401);
    }

    const uid = typeof claims.uid === "string" ? claims.uid.trim() : "";
    const nowSeconds = dependencies.nowSeconds?.() ?? Math.floor(Date.now() / 1000);

    if (
      !uid ||
      claims.email_verified !== true ||
      !hasRecentSignIn(claims.auth_time, nowSeconds)
    ) {
      return jsonResponse({ error: "Unable to authenticate this request." }, 401);
    }

    let firebaseUser: FirebaseCoachProfile;
    try {
      firebaseUser = await dependencies.getFirebaseUser(uid);
    } catch {
      return jsonResponse({ error: "Unable to authenticate this request." }, 401);
    }

    const email = firebaseUser.email?.trim().toLowerCase();
    if (
      firebaseUser.uid !== uid ||
      firebaseUser.emailVerified !== true ||
      !email
    ) {
      return jsonResponse({ error: "Unable to authenticate this request." }, 401);
    }

    const tokenDisplayName =
      typeof claims.name === "string" ? claims.name.trim() : "";
    const displayName = firebaseUser.displayName?.trim() || tokenDisplayName || email;

    try {
      await dependencies.provisionCoach({
        firebaseUid: uid,
        email,
        displayName,
      });

      const sessionCookie = await dependencies.createSessionCookie(
        parsedBody.data.idToken,
        { expiresIn: SESSION_LIFETIME_MS },
      );

      if (!sessionCookie) throw new Error("Session cookie was empty.");

      return jsonResponse(
        { ok: true },
        200,
        { "set-cookie": serializeSessionCookie(sessionCookie, dependencies.secureCookies === true) },
      );
    } catch {
      return jsonResponse(
        { error: "Unable to establish a session. Try again." },
        503,
      );
    }
  };
}

export type SessionCookieClaims = {
  uid?: unknown;
  email_verified?: unknown;
};

export type CoachSession = {
  id: string;
  email: string;
  displayName: string;
};

export type SessionResolverDependencies = {
  verifySessionCookie: (
    cookie: string,
    checkRevoked: true,
  ) => Promise<SessionCookieClaims>;
  findCoachByFirebaseUid: (uid: string) => Promise<CoachSession | null>;
};

export async function resolveCoachFromSessionCookie(
  cookie: string | null | undefined,
  dependencies: SessionResolverDependencies,
): Promise<CoachSession | null> {
  if (!cookie) return null;

  let claims: SessionCookieClaims;
  try {
    claims = await dependencies.verifySessionCookie(cookie, true);
  } catch {
    return null;
  }

  const uid = typeof claims.uid === "string" ? claims.uid : "";
  if (!uid || claims.email_verified !== true) return null;

  const coach = await dependencies.findCoachByFirebaseUid(uid);
  if (!coach || !coach.id || !coach.email || !coach.displayName) return null;

  return {
    id: coach.id,
    email: coach.email,
    displayName: coach.displayName,
  };
}

export class UnauthenticatedCoachError extends Error {
  constructor() {
    super("A verified coach session is required.");
    this.name = "UnauthenticatedCoachError";
  }
}

export async function requireCoachFromSessionCookie(
  cookie: string | null | undefined,
  dependencies: SessionResolverDependencies,
): Promise<CoachSession> {
  const coach = await resolveCoachFromSessionCookie(cookie, dependencies);
  if (!coach) throw new UnauthenticatedCoachError();
  return coach;
}

export function createLogoutPostHandler(secureCookies = false) {
  return async function handleLogoutPost(request: Request): Promise<Response> {
    const invalidRequest = validateMutationRequest(request);
    if (invalidRequest) return invalidRequest;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid request." }, 400);
    }

    if (!logoutRequestSchema.safeParse(body).success) {
      return jsonResponse({ error: "Invalid request." }, 400);
    }

    return jsonResponse(
      { ok: true },
      200,
      { "set-cookie": serializeClearedSessionCookie(secureCookies) },
    );
  };
}
