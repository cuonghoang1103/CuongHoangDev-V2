import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";
    const artist = (formData.get("artist") as string) || "";
    const coverUrl = (formData.get("coverUrl") as string) || "";
    const durationSeconds = parseInt((formData.get("durationSeconds") as string) || "0", 10);

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // Reject files > 50MB at the proxy level to prevent Vercel 413
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: `File too large. Max 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.` },
        { status: 413 }
      );
    }

    // Read backend_token cookie (credentials users)
    let token = request.cookies.get("backend_token")?.value;

    // Also accept Authorization header (localStorage token)
    const authHeader = request.headers.get("Authorization");
    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // For OAuth users, get token from NextAuth session
    if (!token) {
      try {
        const { auth } = await import("@/lib/auth");
        const session = await auth();
        if (session?.user?.email) {
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

          if (res.ok) {
            const data = await res.json();
            token = data.data?.token ?? "";
          }
        }
      } catch (e) {
        console.error("[music/upload] OAuth token fetch failed:", e);
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Forward multipart form data to backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);
    backendFormData.append("title", title);
    backendFormData.append("artist", artist);
    backendFormData.append("coverUrl", coverUrl);
    backendFormData.append("durationSeconds", String(durationSeconds));

    const res = await fetch(`${BACKEND_URL}/api/v1/music/admin/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[music/upload] Error:", err);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
