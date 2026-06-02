import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Clears the backend_token cookie and signs out from NextAuth.
 */
export const dynamic = "force-dynamic";

export async function POST() {
  await signOut({ redirect: false });

  const response = NextResponse.json({ success: true });
  response.cookies.set("backend_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
