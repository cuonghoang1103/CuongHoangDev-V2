import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

// Node.js runtime to handle larger file uploads through the proxy.
// The file travels: browser → Vercel (proxy) → backend server → Supabase
// Since the upload is initiated from the backend server (not the browser),
// the Vercel 4.5MB browser limit does NOT apply.
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // Match backend MusicController.uploadFiles field name: "audio"
    const file = formData.get("audio") as File | null;
    const title = (formData.get("title") as string) || "";
    const artist = (formData.get("artist") as string) || "";
    const durationSeconds = parseInt((formData.get("durationSeconds") as string) || "0", 10);

    if (!file) {
      const fields: string[] = [];
      formData.forEach((_, key) => fields.push(key));
      console.error(`[v1/music/admin/upload] No "audio" field. Available: ${fields.join(", ")}`);
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // Reject files > 100MB at the proxy level
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: `File too large. Max 100MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.` },
        { status: 413 }
      );
    }

    // Get auth token
    let token = request.cookies.get("backend_token")?.value;
    const authHeader = request.headers.get("Authorization");
    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // OAuth users: get token from NextAuth session
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

    // Forward audio file to backend — backend uploads to Supabase and returns audioUrl
    // Cover is handled separately via Cloudinary in Step 2 (create track record)
    const backendFormData = new FormData();
    backendFormData.append("audio", file);
    backendFormData.append("title", title);
    backendFormData.append("artist", artist);
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
