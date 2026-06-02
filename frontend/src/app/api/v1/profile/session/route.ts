import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * GET /api/v1/profile/session
 *
 * Fetches user profile for OAuth (NextAuth) users by looking up their email
 * in the backend. This is an alternative to /api/v1/profile which requires
 * the backend_token cookie (credentials users only).
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const provider = session.user.isSocialUser ? (session.user.provider || "google") : "credentials";
  const role = (session.user.role as string) || "USER";

  try {
    // Check backend for this user
    const res = await fetch(
      `${BACKEND_URL}/api/v1/auth/oauth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName: session.user.name ?? email.split("@")[0],
          provider,
          providerId: session.user.id ?? email,
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, message: "Backend error" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      data: data.data ?? {
        email,
        username: session.user.username ?? email.split("@")[0],
        role,
        roles: [role],
      },
    });
  } catch {
    // Fallback: return data from session token itself
    return NextResponse.json({
      success: true,
      data: {
        email,
        username: session.user.username ?? email.split("@")[0],
        fullName: session.user.name,
        role,
        roles: [role],
      },
    });
  }
}
