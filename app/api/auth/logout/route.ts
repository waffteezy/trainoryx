import { createLogoutPostHandler } from "@/src/lib/auth/session-core";

const handleLogoutPost = createLogoutPostHandler(
  process.env.NODE_ENV === "production",
);

export async function POST(request: Request) {
  return handleLogoutPost(request);
}
