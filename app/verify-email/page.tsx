import type { Metadata } from "next";
import { AuthShell } from "@/src/features/auth/components/auth-shell";
import { VerificationPanel } from "@/src/features/auth/components/verification-panel";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Verify the email address on your Trainoryx coach account.",
};

export default function VerifyEmailPage() {
  return (
    <AuthShell
      description="One quick check keeps your coach account protected."
      eyebrow="EMAIL VERIFICATION"
      title="Check your inbox"
    >
      <VerificationPanel />
    </AuthShell>
  );
}
