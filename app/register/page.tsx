import type { Metadata } from "next";
import { AuthShell } from "@/src/features/auth/components/auth-shell";
import { RegistrationForm } from "@/src/features/auth/components/registration-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a coach account for Trainoryx.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      description="Set up your coach account. You’ll verify your email before moving on."
      eyebrow="GET STARTED"
      title="Create your account"
    >
      <RegistrationForm />
    </AuthShell>
  );
}
