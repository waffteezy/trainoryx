"use client";

import Link from "next/link";
import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthButton, AuthField, AuthMessage } from "./auth-controls";
import { firebaseAuth } from "@/src/lib/firebase/client";
import { getFirebaseAuthErrorMessage } from "@/src/lib/firebase/error-message";
import { establishServerSession } from "@/src/lib/firebase/session-client";
import { getFieldErrors, loginSchema } from "@/src/lib/validation/auth";

export function LoginForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
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
    const parsed = loginSchema.safeParse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setPending(true);

    let user: User;

    try {
      ({ user } = await signInWithEmailAndPassword(
        firebaseAuth,
        parsed.data.email,
        parsed.data.password,
      ));
    } catch (error) {
      setFormError(getFirebaseAuthErrorMessage(error));
      setPending(false);
      return;
    }

    if (!user.emailVerified) {
      router.replace("/verify-email");
      return;
    }

    try {
      await establishServerSession(user);
      router.replace("/auth-ready");
    } catch {
      setFormError("We couldn’t create a secure session. Please sign in again.");
      setPending(false);
    }
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
        onChange={() => clearFieldError("email")}
        placeholder="you@example.com"
        required
        spellCheck={false}
        type="email"
      />
      <div className="space-y-2">
        <AuthField
          autoComplete="current-password"
          disabled={pending}
          error={fieldErrors.password}
          label="Password"
          name="password"
          onChange={() => clearFieldError("password")}
          placeholder="Enter your password"
          required
          type="password"
        />
        <div className="text-right">
          <Link
            className="text-sm font-semibold text-[#326d32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b9c39]"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <AuthButton pending={pending} pendingLabel="Signing in…">
        Sign in
      </AuthButton>

      <p className="pt-1 text-center text-sm text-[#69776d]">
        New to Trainoryx?{" "}
        <Link
          className="font-semibold text-[#326d32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b9c39]"
          href="/register"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
