import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userApi } from "@/lib/api";

/**
 * GET /api/admin/users/nextauth
 * Returns all users from the Spring Boot backend.
 * Protected — only admins can access.
 * Note: NextAuth social users are stored in JWT only (no Prisma/DB dependency).
 * Social users are synced to Spring Boot via /api/auth/sync on login.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const size = parseInt(searchParams.get("size") || "15");
    const keyword = searchParams.get("keyword") || "";

    // Fetch users from Spring Boot backend
    const res = await userApi.getAll({ page, size, keyword });

    return NextResponse.json({
      success: true,
      data: res.data.data,
    });
  } catch (error) {
    console.error("[AdminUsers] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
