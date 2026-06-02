import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * POST /api/auth/oauth/token
 *
 * Generates a backend JWT for an OAuth user (Google/GitHub) who just signed in.
 * This sets the backend_token cookie so ALL authenticated backend API calls work
 * for both credentials and OAuth users.
 *
 * Called by the /oauth-callback page after NextAuth session is established.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.user.email,
        fullName: session.user.name ?? session.user.email.split("@")[0],
        provider: user.provider ?? "google",
        providerId: user.id ?? "",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[oauth/token] Backend error:", err);
      return NextResponse.json({ success: false, message: "Failed to generate token" }, { status: 500 });
    }

    const data = await res.json();
    const token = data.data?.token ?? "";

    if (!token) {
      return NextResponse.json({ success: false, message: "No token received" }, { status: 500 });
    }

    // Set backend_token cookie (httpOnly, 7 days)
    const response = NextResponse.json({ success: true, token });
    response.cookies.set("backend_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[oauth/token] Error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
