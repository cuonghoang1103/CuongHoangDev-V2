import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * POST /api/auth/login
 *
 * Credentials login — calls Spring Boot backend directly.
 * Sets backend_token cookie so all /api/v1/* proxy calls are authenticated.
 *
 * For credentials users: NextAuth session is NOT needed — the backend_token cookie
 * is sufficient for auth. NextAuth is used only for OAuth sessions.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Call Spring Boot backend
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      let message = "Incorrect username or password";
      try {
        const err = await res.json();
        message = err.message ?? message;
      } catch {
        // use default
      }
      return NextResponse.json({ success: false, message }, { status: 401 });
    }

    const data = await res.json();
    const { token, userId, email, role } = data.data ?? {};

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication failed" },
        { status: 500 }
      );
    }

    // Store backend JWT in httpOnly cookie (7 days)
    const response = NextResponse.json({
      success: true,
      data: { userId, username, email, role },
    });

    response.cookies.set("backend_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[login] Error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
