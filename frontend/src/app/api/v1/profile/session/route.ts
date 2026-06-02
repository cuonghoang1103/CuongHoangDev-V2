import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET /api/v1/profile/session
 *
 * Returns user profile from the NextAuth JWT session (NOT from the backend).
 * Role is set in the JWT by the jwt callback which already fetched from the backend.
 *
 * Since the /admin/* middleware has already verified the user is an ADMIN,
 * we can safely trust the role in the session token.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;
  const role = (user.role as string) || "USER";
  const username = (user.username as string) || user.email.split("@")[0];
  const name = user.name || username;

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username,
      fullName: name,
      primaryRole: role,
      roles: [role],
    },
  });
}
