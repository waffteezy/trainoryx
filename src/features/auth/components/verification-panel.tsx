"use client";

import Link from "next/link";
import {
  getIdToken,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { AuthButton, AuthMessage } from "./auth-controls";
import { firebaseAuth } from "@/src/lib/firebase/client";
import { getFirebaseAuthErrorMessage } from "@/src/lib/firebase/error-message";
import { establishServerSession } from "@/src/lib/firebase/session-client";
import { useRouter } from "next/navigation";

type VerificationState = "loading" | "missing" | "waiting" | "verified";

export function VerificationPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<VerificationState>("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setError(null);
      setNotice(null);
      setUser(nextUser);

      if (!nextUser) {
        setState("missing");
        return;
      }

      setState("loading");

      void (async () => {
        try {
          await reload(nextUser);
          if (!active || firebaseAuth.currentUser?.uid !== nextUser.uid) return;

          setUser(nextUser);

          if (nextUser.emailVerified) {
            setState("verified");
            try {
              await getIdToken(nextUser, true);
            } catch (cause) {
              setError(getFirebaseAuthErrorMessage(cause));
            }
          } else {
            setState("waiting");
          }
        } catch (cause) {
          if (!active || firebaseAuth.currentUser?.uid !== nextUser.uid) return;
          setState("waiting");
          setError(getFirebaseAuthErrorMessage(cause));
        }
      })();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function resendVerification() {
    const currentUser = firebaseAuth.currentUser;
    setError(null);
    setNotice(null);

    if (!currentUser) {
      setUser(null);
      setState("missing");
      return;
    }

    setResending(true);

    try {
      await sendEmailVerification(currentUser);
      setNotice("A new verification email is on its way. Check your inbox.");
    } catch (cause) {
      setError(getFirebaseAuthErrorMessage(cause));
    } finally {
      setResending(false);
    }
  }

  async function refreshVerificationStatus() {
    const currentUser = firebaseAuth.currentUser;
    setError(null);
    setNotice(null);

    if (!currentUser) {
      setUser(null);
      setState("missing");
      return;
    }

    setRefreshing(true);

    try {
      await reload(currentUser);

      if (currentUser.emailVerified) {
        setUser(currentUser);
        setState("verified");
        await establishServerSession(currentUser);
        router.replace("/auth-ready");
      } else {
        setUser(currentUser);
        setState("waiting");
        setNotice(
          "We haven’t received confirmation yet. Open the email link, then refresh this status.",
        );
      }
    } catch (cause) {
      setError(
        currentUser.emailVerified
          ? "Your email is verified, but we couldn’t create a secure session. Return to sign in and try again."
          : getFirebaseAuthErrorMessage(cause),
      );
    } finally {
      setRefreshing(false);
    }
  }

  if (state === "loading") {
    return (
      <p aria-live="polite" className="text-sm text-[#68766d]" role="status">
        Checking your sign-in…
      </p>
    );
  }

  if (state === "missing") {
    return (
      <div className="space-y-5">
        <AuthMessage tone="info">
          Sign in first to resend a verification email or check its status.
        </AuthMessage>
        <Link
          className="block text-center text-sm font-semibold text-[#326d32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b9c39]"
          href="/login"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#e1e9e2] bg-[#f8faf8] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#718076]">
          Account email
        </p>
        <p className="mt-1 break-all text-sm font-semibold text-[#24362b]">
          {user?.email ?? "Email unavailable"}
        </p>
      </div>

      {state === "verified" ? (
        <AuthMessage tone="success">
          Your email is verified. Continue to start a secure coach session.
        </AuthMessage>
      ) : (
        <AuthMessage tone="info">
          Open the verification link we sent to this address. You can resend it
          or refresh the status after verifying.
        </AuthMessage>
      )}

      {notice ? <AuthMessage tone="success">{notice}</AuthMessage> : null}
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

      {state === "waiting" ? (
        <>
          <AuthButton
            disabled={refreshing}
            onClick={resendVerification}
            pending={resending}
            pendingLabel="Sending verification…"
            type="button"
          >
            Resend verification email
          </AuthButton>
          <AuthButton
            disabled={resending}
            onClick={refreshVerificationStatus}
            pending={refreshing}
            pendingLabel="Checking status…"
            type="button"
            variant="secondary"
          >
            Refresh verification status
          </AuthButton>
        </>
      ) : (
        <AuthButton
          onClick={refreshVerificationStatus}
          pending={refreshing}
          pendingLabel="Starting session…"
          type="button"
          variant="secondary"
        >
          Continue to Trainoryx
        </AuthButton>
      )}

      <p className="text-center text-sm text-[#69776d]">
        Need another account?{" "}
        <Link
          className="font-semibold text-[#326d32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b9c39]"
          href="/login"
        >
          Return to sign in
        </Link>
      </p>
    </div>
  );
}
