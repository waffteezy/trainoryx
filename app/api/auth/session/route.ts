import "server-only";

import { getFirebaseAdminAuth } from "@/src/lib/firebase/admin";
import { createSessionPostHandler } from "@/src/lib/auth/session-core";
import type { CoachIdentity } from "@/src/lib/auth/session-core";

const handleSessionPost = createSessionPostHandler({
  verifyIdToken: (idToken, checkRevoked) =>
    getFirebaseAdminAuth().verifyIdToken(idToken, checkRevoked),
  getFirebaseUser: (uid) => getFirebaseAdminAuth().getUser(uid),
  provisionCoach: async (identity: CoachIdentity) => {
    const { provisionCoach } = await import("@/src/lib/auth/provision-coach");
    return provisionCoach(identity);
  },
  createSessionCookie: (idToken, options) =>
    getFirebaseAdminAuth().createSessionCookie(idToken, options),
  secureCookies: process.env.NODE_ENV === "production",
});

export async function POST(request: Request) {
  return handleSessionPost(request);
}
