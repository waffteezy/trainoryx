"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthButton, AuthMessage } from "./auth-controls";
import { endServerSession } from "@/src/lib/firebase/session-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      await endServerSession();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("We couldn’t complete sign out. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
      <AuthButton
        onClick={handleLogout}
        pending={pending}
        pendingLabel="Signing out…"
        type="button"
      >
        Sign out
      </AuthButton>
    </div>
  );
}
