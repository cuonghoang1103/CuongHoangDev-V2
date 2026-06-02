import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * POST /api/auth/login
 * Unified login — calls Spring Boot backend, stores the JWT token in a cookie
 * so that subsequent API calls via the middleware can attach the Bearer token.
 *
 * This replaces the direct backend auth approach while keeping NextAuth session
 * for frontend auth (OAuth, session management, middleware protection).
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

    // Call Spring Boot backend to authenticate
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

    // Also trigger NextAuth credentials sign-in so the session cookie is set
    await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    // Store backend JWT in a short-lived cookie (7 days)
    const response = NextResponse.json({
      success: true,
      data: { userId, username, email, role },
    });

    response.cookies.set("backend_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
