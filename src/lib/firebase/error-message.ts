export function getFirebaseAuthErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  switch (getFirebaseAuthErrorCode(error)) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in or resetting your password.";
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      return "Choose a stronger password with at least 8 characters.";
    case "auth/user-disabled":
      return "This account is unavailable. Contact support if you need help.";
    case "auth/too-many-requests":
      return "There have been too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed":
      return "We couldn’t reach Firebase. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email and password sign-in is unavailable right now.";
    default:
      return "We couldn’t complete that request. Try again.";
  }
}
