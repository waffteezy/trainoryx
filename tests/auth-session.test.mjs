import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createLogoutPostHandler,
  createSessionPostHandler,
  requireCoachFromSessionCookie,
  resolveCoachFromSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_LIFETIME_SECONDS,
  UnauthenticatedCoachError,
} from "../src/lib/auth/session-core.ts";
import {
  CoachProvisioningConflictError,
  upsertCoachByFirebaseUid,
} from "../src/lib/auth/provision-coach-core.ts";

const ORIGIN = "http://localhost:3000";
const VALID_CLAIMS = {
  uid: "firebase-coach-1",
  email_verified: true,
  auth_time: 1_000,
  name: "Token Coach",
};
const FIREBASE_USER = {
  uid: "firebase-coach-1",
  email: "Coach@Example.com",
  emailVerified: true,
  displayName: "Coach Name",
};

function makeRequest(path, body, headerOverrides = {}) {
  const headers = new Headers({
    origin: ORIGIN,
    host: "localhost:3000",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
    "x-trainoryx-csrf": "1",
    ...headerOverrides,
  });

  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function createDependencies(overrides = {}) {
  const calls = [];
  const dependencies = {
    verifyIdToken: async (token, checkRevoked) => {
      calls.push(["verifyIdToken", token, checkRevoked]);
      return VALID_CLAIMS;
    },
    getFirebaseUser: async (uid) => {
      calls.push(["getFirebaseUser", uid]);
      return FIREBASE_USER;
    },
    provisionCoach: async (identity) => {
      calls.push(["provisionCoach", identity]);
      return { id: "internal-coach-id" };
    },
    createSessionCookie: async (token, options) => {
      calls.push(["createSessionCookie", token, options]);
      return "opaque-session-value";
    },
    nowSeconds: () => 1_100,
    secureCookies: true,
    ...overrides,
  };

  return { calls, dependencies };
}

describe("session endpoint", () => {
  it("rejects a missing ID token before contacting Firebase", async () => {
    const { calls, dependencies } = createDependencies();
    const response = await createSessionPostHandler(dependencies)(
      makeRequest("/api/auth/session", {}),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(calls, []);
  });

  it("rejects an invalid ID token", async () => {
    const { dependencies } = createDependencies({
      verifyIdToken: async () => {
        throw new Error("private Firebase error");
      },
    });

    const response = await createSessionPostHandler(dependencies)(
      makeRequest("/api/auth/session", { idToken: "invalid" }),
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: "Unable to authenticate this request.",
    });
  });

  it("rejects an unverified Firebase identity", async () => {
    const { calls, dependencies } = createDependencies({
      verifyIdToken: async () => ({ ...VALID_CLAIMS, email_verified: false }),
    });

    const response = await createSessionPostHandler(dependencies)(
      makeRequest("/api/auth/session", { idToken: "verified-token" }),
    );

    assert.equal(response.status, 401);
    assert.equal(calls.some(([name]) => name === "provisionCoach"), false);
  });

  it("rejects authentication older than five minutes", async () => {
    const { calls, dependencies } = createDependencies({
      verifyIdToken: async () => ({ ...VALID_CLAIMS, auth_time: 799 }),
    });

    const response = await createSessionPostHandler(dependencies)(
      makeRequest("/api/auth/session", { idToken: "stale-token" }),
    );

    assert.equal(response.status, 401);
    assert.equal(calls.some(([name]) => name === "getFirebaseUser"), false);
  });

  it("rejects authentication timestamps in the future", async () => {
    const { dependencies } = createDependencies({
      verifyIdToken: async () => ({ ...VALID_CLAIMS, auth_time: 1_101 }),
    });

    const response = await createSessionPostHandler(dependencies)(
      makeRequest("/api/auth/session", { idToken: "future-token" }),
    );

    assert.equal(response.status, 401);
  });

  it("provisions before setting a five-day secure session cookie", async () => {
    const { calls, dependencies } = createDependencies();
    const response = await createSessionPostHandler(dependencies)(
      makeRequest("/api/auth/session", { idToken: "fresh-token" }),
    );
    const payload = await response.json();
    const cookie = response.headers.get("set-cookie");

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true });
    assert.deepEqual(
      calls.map(([name]) => name),
      ["verifyIdToken", "getFirebaseUser", "provisionCoach", "createSessionCookie"],
    );
    assert.deepEqual(calls[2][1], {
      firebaseUid: "firebase-coach-1",
      email: "coach@example.com",
      displayName: "Coach Name",
    });
    assert.deepEqual(calls[3][2], { expiresIn: SESSION_LIFETIME_SECONDS * 1000 });
    assert.match(cookie, new RegExp(`^${SESSION_COOKIE_NAME}=opaque-session-value;`));
    assert.match(cookie, /Max-Age=432000/);
    assert.match(cookie, /Path=\//);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Secure/);
    assert.doesNotMatch(cookie, /Domain=/i);
    assert.doesNotMatch(JSON.stringify(payload), /opaque-session-value|fresh-token/);
  });

  it("does not issue a session when provisioning fails", async () => {
    const { calls, dependencies } = createDependencies({
      provisionCoach: async () => {
        throw new CoachProvisioningConflictError();
      },
    });

    const response = await createSessionPostHandler(dependencies)(
      makeRequest("/api/auth/session", { idToken: "fresh-token" }),
    );

    assert.equal(response.status, 503);
    assert.equal(response.headers.has("set-cookie"), false);
    assert.equal(calls.some(([name]) => name === "createSessionCookie"), false);
  });

  it("rejects cross-origin requests and missing CSRF headers", async () => {
    const { calls, dependencies } = createDependencies();
    const handle = createSessionPostHandler(dependencies);

    const crossOrigin = await handle(
      makeRequest("/api/auth/session", { idToken: "token" }, { origin: "https://attacker.example" }),
    );
    const missingCsrf = await handle(
      makeRequest("/api/auth/session", { idToken: "token" }, { "x-trainoryx-csrf": "" }),
    );

    assert.equal(crossOrigin.status, 403);
    assert.equal(missingCsrf.status, 403);
    assert.deepEqual(calls, []);
  });
});

describe("coach provisioning", () => {
  it("retries idempotently by Firebase UID and normalizes the verified email", async () => {
    const upsertArguments = [];
    const upsert = async (args) => {
      upsertArguments.push(args);
      return { id: "internal-coach-id" };
    };
    const identity = {
      firebaseUid: " firebase-coach-1 ",
      email: " Coach@Example.com ",
      displayName: " Coach Name ",
    };

    await upsertCoachByFirebaseUid(identity, upsert);
    await upsertCoachByFirebaseUid(identity, upsert);

    assert.equal(upsertArguments.length, 2);
    assert.deepEqual(upsertArguments[0], {
      where: { firebaseUid: "firebase-coach-1" },
      create: {
        firebaseUid: "firebase-coach-1",
        email: "coach@example.com",
        displayName: "Coach Name",
      },
      update: { email: "coach@example.com", displayName: "Coach Name" },
    });
    assert.deepEqual(upsertArguments[0], upsertArguments[1]);
  });

  it("surfaces unique-email conflicts without matching by email", async () => {
    let receivedArguments;
    await assert.rejects(
      upsertCoachByFirebaseUid(
        {
          firebaseUid: "new-firebase-uid",
          email: "coach@example.com",
          displayName: "Coach",
        },
        async (args) => {
          receivedArguments = args;
          throw { code: "P2002" };
        },
      ),
      CoachProvisioningConflictError,
    );
    assert.deepEqual(receivedArguments.where, { firebaseUid: "new-firebase-uid" });
  });
});

describe("session verification and logout", () => {
  it("rejects a missing cookie without calling Firebase", async () => {
    const session = await resolveCoachFromSessionCookie(null, {
      verifySessionCookie: async () => {
        throw new Error("must not be called");
      },
      findCoachByFirebaseUid: async () => null,
    });

    assert.equal(session, null);
  });

  it("rejects revoked cookies and missing or unverified coach records", async () => {
    const revoked = await resolveCoachFromSessionCookie("revoked-cookie", {
      verifySessionCookie: async () => {
        throw new Error("revoked");
      },
      findCoachByFirebaseUid: async () => null,
    });
    const unverified = await resolveCoachFromSessionCookie("unverified-cookie", {
      verifySessionCookie: async () => ({ uid: "firebase-coach-1", email_verified: false }),
      findCoachByFirebaseUid: async () => null,
    });
    const missingCoach = await resolveCoachFromSessionCookie("valid-cookie", {
      verifySessionCookie: async () => ({ uid: "firebase-coach-1", email_verified: true }),
      findCoachByFirebaseUid: async () => null,
    });

    assert.equal(revoked, null);
    assert.equal(unverified, null);
    assert.equal(missingCoach, null);
  });

  it("requires a valid coach for protected server access", async () => {
    await assert.rejects(
      requireCoachFromSessionCookie(null, {
        verifySessionCookie: async () => ({ uid: "firebase-coach-1", email_verified: true }),
        findCoachByFirebaseUid: async () => null,
      }),
      UnauthenticatedCoachError,
    );
  });

  it("clears the session cookie on a same-origin logout", async () => {
    const response = await createLogoutPostHandler(true)(
      makeRequest("/api/auth/logout", {}),
    );
    const cookie = response.headers.get("set-cookie");

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.match(cookie, new RegExp(`^${SESSION_COOKIE_NAME}=;`));
    assert.match(cookie, /Max-Age=0/);
    assert.match(cookie, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Secure/);
    assert.doesNotMatch(cookie, /Domain=/i);
  });

  it("rejects cross-origin logout requests", async () => {
    const response = await createLogoutPostHandler()(
      makeRequest("/api/auth/logout", {}, { origin: "https://attacker.example" }),
    );

    assert.equal(response.status, 403);
    assert.equal(response.headers.has("set-cookie"), false);
  });

  it("rejects non-POST requests", async () => {
    const request = new Request(`${ORIGIN}/api/auth/logout`, { method: "GET" });
    const response = await createLogoutPostHandler()(request);

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
  });
});
