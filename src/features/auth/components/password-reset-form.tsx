"use client";

import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState, type FormEvent } from "react";
import { AuthButton, AuthField, AuthMessage } from "./auth-controls";
import { firebaseAuth } from "@/src/lib/firebase/client";
import {
  getFirebaseAuthErrorCode,
  getFirebaseAuthErrorMessage,
} from "@/src/lib/firebase/error-message";
import { getFieldErrors, passwordResetSchema } from "@/src/lib/validation/auth";

export function PasswordResetForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function clearFieldError() {
    setFormError(null);
    setFieldErrors((current) => {
      if (!current.email) return current;
      const next = { ...current };
      delete next.email;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = passwordResetSchema.safeParse({
      email: String(formData.get("email") ?? ""),
    });

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setPending(true);

    try {
      await sendPasswordResetEmail(firebaseAuth, parsed.data.email);
      setSubmittedEmail(parsed.data.email);
    } catch (error) {
      if (getFirebaseAuthErrorCode(error) === "auth/user-not-found") {
        setSubmittedEmail(parsed.data.email);
      } else {
        setFormError(getFirebaseAuthErrorMessage(error));
      }
    } finally {
      setPending(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="space-y-5">
        <AuthMessage tone="success">
          If an account exists for {submittedEmail}, password reset instructions
          will be sent shortly.
        </AuthMessage>
        <Link
          className="block text-center text-sm font-semibold text-[#326d32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b9c39]"
          href="/login"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {formError ? <AuthMessage tone="error">{formError}</AuthMessage> : null}
      <AuthField
        autoComplete="email"
        autoCapitalize="none"
        disabled={pending}
        error={fieldErrors.email}
        label="Email address"
        name="email"
        onChange={clearFieldError}
        placeholder="you@example.com"
        required
        spellCheck={false}
        type="email"
      />
      <AuthButton pending={pending} pendingLabel="Sending instructions…">
        Send reset instructions
      </AuthButton>
      <p className="pt-1 text-center text-sm text-[#69776d]">
        Remembered your password?{" "}
        <Link
          className="font-semibold text-[#326d32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b9c39]"
          href="/login"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
