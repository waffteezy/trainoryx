import type { Metadata } from "next";
import { AuthShell } from "@/src/features/auth/components/auth-shell";
import { LoginForm } from "@/src/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Trainoryx coach account.",
};

export default function LoginPage() {
  return (
    <AuthShell
      description="Sign in to continue to your coach workspace."
      eyebrow="YOUR WORKSPACE"
      title="Welcome back"
    >
      <LoginForm />
    </AuthShell>
  );
}
