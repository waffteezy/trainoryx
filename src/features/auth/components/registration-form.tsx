"use client";

import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthButton, AuthField, AuthMessage } from "./auth-controls";
import { firebaseAuth } from "@/src/lib/firebase/client";
import { getFirebaseAuthErrorMessage } from "@/src/lib/firebase/error-message";
import { getFieldErrors, registrationSchema } from "@/src/lib/validation/auth";

export function RegistrationForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [setupIncomplete, setSetupIncomplete] = useState(false);
  const [pending, setPending] = useState(false);

  function clearFieldError(field: string) {
    setFormError(null);
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = registrationSchema.safeParse({
      displayName: String(formData.get("displayName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setPending(true);

    let userCredential;

    try {
      userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        parsed.data.email,
        parsed.data.password,
      );
    } catch (error) {
      setFormError(getFirebaseAuthErrorMessage(error));
      setPending(false);
      return;
    }

    let followUpFailed = false;

    try {
      await updateProfile(userCredential.user, {
        displayName: parsed.data.displayName,
      });
    } catch {
      followUpFailed = true;
    }

    try {
      await sendEmailVerification(userCredential.user);
    } catch {
      followUpFailed = true;
    }

    if (followUpFailed) {
      setSetupIncomplete(true);
      setPending(false);
      return;
    }

    router.replace("/verify-email");
  }

  if (setupIncomplete) {
    return (
      <div className="space-y-5">
        <AuthMessage tone="info">
          Your account was created, but some setup steps did not finish. Continue
          to email verification and resend the message if needed.
        </AuthMessage>
        <AuthButton onClick={() => router.replace("/verify-email")} type="button">
          Continue to verification
        </AuthButton>
      </div>
    );
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      {formError ? <AuthMessage tone="error">{formError}</AuthMessage> : null}

      <AuthField
        autoComplete="name"
        disabled={pending}
        error={fieldErrors.displayName}
        label="Display name"
        name="displayName"
        onChange={() => clearFieldError("displayName")}
        placeholder="How should we address you?"
        required
        type="text"
      />
      <AuthField
        autoComplete="email"
        autoCapitalize="none"
        disabled={pending}
        error={fieldErrors.email}
        label="Email address"
        name="email"
        onChange={() => clearFieldError("email")}
        placeholder="you@example.com"
        required
        spellCheck={false}
        type="email"
      />
      <AuthField
        autoComplete="new-password"
        disabled={pending}
        error={fieldErrors.password}
        label="Password"
        name="password"
        onChange={() => clearFieldError("password")}
        placeholder="At least 8 characters"
        required
        type="password"
      />
      <AuthField
        autoComplete="new-password"
        disabled={pending}
        error={fieldErrors.confirmPassword}
        label="Confirm password"
        name="confirmPassword"
        onChange={() => clearFieldError("confirmPassword")}
        placeholder="Enter your password again"
        required
        type="password"
      />

      <div className="pt-2">
        <AuthButton pending={pending} pendingLabel="Creating account…">
          Create coach account
        </AuthButton>
      </div>

      <p className="pt-1 text-center text-sm text-[#69776d]">
        Already have an account?{" "}
        <Link
          className="font-semibold text-[#326d32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b9c39]"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
