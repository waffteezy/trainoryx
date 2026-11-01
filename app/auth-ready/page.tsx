import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthMessage } from "@/src/features/auth/components/auth-controls";
import { AuthShell } from "@/src/features/auth/components/auth-shell";
import { LogoutButton } from "@/src/features/auth/components/logout-button";
import {
  requireCoach,
  UnauthenticatedCoachError,
} from "@/src/lib/auth/coach-session";

export const metadata: Metadata = {
  title: "Coach session",
  description: "A protected Trainoryx coach session checkpoint.",
};

async function ProtectedCoachCheckpoint() {
  let coach;

  try {
    coach = await requireCoach();
  } catch (error) {
    if (error instanceof UnauthenticatedCoachError) redirect("/login");
    throw error;
  }

  return (
    <AuthShell
      description="Your server-side coach session is verified."
      eyebrow="PROTECTED COACH AREA"
      title="Coach session active"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-[#e1e9e2] bg-[#f8faf8] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#718076]">
            Signed in as
          </p>
          <p className="mt-1 text-sm font-semibold text-[#24362b]">
            {coach.displayName}
          </p>
          <p className="mt-1 break-all text-sm text-[#68766d]">{coach.email}</p>
        </div>
        <AuthMessage tone="info">
          The server has verified your coach session. The workspace dashboard is
          not part of this milestone yet.
        </AuthMessage>
        <LogoutButton />
      </div>
    </AuthShell>
  );
}

function SessionLoading() {
  return (
    <AuthShell
      description="Confirming your secure coach session."
      eyebrow="PROTECTED COACH AREA"
      title="Checking your session"
    >
      <p aria-live="polite" className="text-sm text-[#68766d]" role="status">
        Loading your account…
      </p>
    </AuthShell>
  );
}

export default function AuthReadyPage() {
  return (
    <Suspense fallback={<SessionLoading />}>
      <ProtectedCoachCheckpoint />
    </Suspense>
  );
}
