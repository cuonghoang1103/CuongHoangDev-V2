import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * Server-side music upload.
 *
 * Flow:
 *  1. Verify auth from Authorization header (set by frontend from localStorage)
 *     or from backend_token httpOnly cookie.
 *  2. Forward file + metadata to the Java backend endpoint
 *     POST /api/v1/music/admin/upload (multipart/form-data).
 *  3. Backend streams the audio to Supabase Storage and saves the DB record
 *     in a single server-to-server call — no Vercel 4.5MB body limit applies.
 *
 * This is the SIMPLEST, most reliable path:
 *  - Frontend only sends the file once.
 *  - Backend does both Supabase upload and DB insert.
 *  - No CORS, no signed URL, no bucket policy issues.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 minutes for large audio files

export async function POST(request: NextRequest) {
    const start = Date.now();
    console.log(`[music/upload] ===== ENTRY =====`);

    try {
        // 1. Auth resolution
        let token = request.headers.get("Authorization")?.replace("Bearer ", "").trim();
        if (!token) token = request.cookies.get("backend_token")?.value || "";
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized: no auth token" },
                { status: 401 }
            );
        }

        // 2. Read multipart form data from incoming request
        const formData = await request.formData();
        const file = formData.get("audio") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, message: "No 'audio' file provided" },
                { status: 400 }
            );
        }

        const title = (formData.get("title") as string) || "";
        const artist = (formData.get("artist") as string) || "";
        const durationSeconds = parseInt((formData.get("durationSeconds") as string) || "0", 10);

        console.log(`[music/upload] File: ${file.name} (${file.size} bytes)`);
        console.log(`[music/upload] Title: ${title}, Artist: ${artist}, Duration: ${durationSeconds}s`);

        // 3. Build new FormData for backend (must use the File object as-is)
        const backendForm = new FormData();
        backendForm.append("audio", file, file.name);
        backendForm.append("title", title);
        backendForm.append("artist", artist);
        backendForm.append("durationSeconds", String(durationSeconds));

        // 4. Forward to backend
        const backendRes = await fetch(`${BACKEND_URL}/api/v1/music/admin/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: backendForm,
        });

        const data = await backendRes.json().catch(() => ({ message: "Failed to parse backend response" }));
        console.log(`[music/upload] Backend response: HTTP ${backendRes.status} (${Date.now() - start}ms)`);
        console.log(`[music/upload] Backend data:`, JSON.stringify(data, null, 2));

        return NextResponse.json(data, { status: backendRes.status });
    } catch (err: any) {
        console.error(`[music/upload] FAILED (${Date.now() - start}ms):`, err);
        return NextResponse.json(
            {
                success: false,
                message: "Upload proxy error: " + (err instanceof Error ? err.message : String(err)),
            },
            { status: 502 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
        },
    });
}
