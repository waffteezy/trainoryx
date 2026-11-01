export type VerifiedCoachIdentity = {
  firebaseUid: string;
  email: string;
  displayName: string;
};

export type CoachUpsertArgs = {
  where: { firebaseUid: string };
  create: {
    firebaseUid: string;
    email: string;
    displayName: string;
  };
  update: {
    email: string;
    displayName: string;
  };
};

export class CoachProvisioningConflictError extends Error {
  constructor() {
    super("The verified coach identity conflicts with an existing account.");
    this.name = "CoachProvisioningConflictError";
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function upsertCoachByFirebaseUid<T>(
  identity: VerifiedCoachIdentity,
  upsert: (args: CoachUpsertArgs) => Promise<T>,
): Promise<T> {
  const firebaseUid = identity.firebaseUid.trim();
  const email = identity.email.trim().toLowerCase();
  const displayName = identity.displayName.trim() || email;

  if (!firebaseUid || !email) {
    throw new Error("A verified Firebase UID and email are required.");
  }

  try {
    return await upsert({
      where: { firebaseUid },
      create: { firebaseUid, email, displayName },
      update: { email, displayName },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new CoachProvisioningConflictError();
    }

    throw error;
  }
}
