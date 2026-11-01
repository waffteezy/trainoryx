import type { Metadata } from "next";
import { AuthShell } from "@/src/features/auth/components/auth-shell";
import { PasswordResetForm } from "@/src/features/auth/components/password-reset-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request password reset instructions for your Trainoryx account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Enter the email address associated with your coach account."
      eyebrow="ACCOUNT RECOVERY"
      title="Reset your password"
    >
      <PasswordResetForm />
    </AuthShell>
  );
}
