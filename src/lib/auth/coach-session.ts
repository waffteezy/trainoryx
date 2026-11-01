import "server-only";

import { cookies } from "next/headers";
import { getFirebaseAdminAuth } from "@/src/lib/firebase/admin";
import { prisma } from "@/src/lib/db/prisma";
import {
  requireCoachFromSessionCookie,
  resolveCoachFromSessionCookie,
  SESSION_COOKIE_NAME,
} from "./session-core";

export { UnauthenticatedCoachError } from "./session-core";

function sessionDependencies() {
  return {
    verifySessionCookie: (cookie: string, checkRevoked: true) =>
      getFirebaseAdminAuth().verifySessionCookie(cookie, checkRevoked),
    findCoachByFirebaseUid: (firebaseUid: string) =>
      prisma.user.findUnique({
        where: { firebaseUid },
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      }),
  };
}

export async function getCoachSession() {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return resolveCoachFromSessionCookie(cookie, sessionDependencies());
}

export async function requireCoach() {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return requireCoachFromSessionCookie(cookie, sessionDependencies());
}
