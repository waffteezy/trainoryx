import "server-only";

import { prisma } from "@/src/lib/db/prisma";
import {
  upsertCoachByFirebaseUid,
  type CoachUpsertArgs,
  type VerifiedCoachIdentity,
} from "./provision-coach-core";

export async function provisionCoach(identity: VerifiedCoachIdentity) {
  return upsertCoachByFirebaseUid(identity, (args: CoachUpsertArgs) =>
    prisma.user.upsert({
      ...args,
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    }),
  );
}
