import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * Dedicated proxy for RAW BINARY audio uploads.
 *
 * The catch-all [[...path]] proxy reads body as text() which corrupts binary
 * audio files and sets Content-Type: application/json — both break Supabase.
 *
 * This route reads body as raw bytes and forwards unchanged.
 *
 * Auth: reads from Authorization header (frontend sets this) AND backend_token
 * cookie (httpOnly, set by backend). Both are forwarded to satisfy
 * JwtAuthenticationFilter.
 *
 * Frontend: PUT /api/v1/music/admin/upload/audio/raw?filename=track.mp3
 * Body: raw binary audio bytes
 */
export const runtime = 'nodejs';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
    });
}

export async function PUT(request: NextRequest) {
    const search = request.nextUrl.search;

    // Read auth from BOTH sources:
    // 1. Authorization header (set by frontend from localStorage token)
    // 2. backend_token cookie (httpOnly cookie from backend login)
    // Backend JwtAuthenticationFilter checks the header; having both is safe.
    let token = request.headers.get("Authorization")?.replace("Bearer ", "").trim();
    if (!token) {
        token = request.cookies.get("backend_token")?.value || "";
    }

    const backendUrl = `${BACKEND_URL}/api/v1/music/admin/upload/audio/raw${search}`;

    console.log(`[music/upload/audio/raw] Forwarding raw binary PUT to backend: ${backendUrl}`);
    console.log(`[music/upload/audio/raw] Token present: ${token ? 'yes (len=' + token.length + ')' : 'NO — will likely 401'}`);

    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Read body as raw bytes — do NOT read as text() or JSON.stringify()
    const body = await request.arrayBuffer();

    console.log(`[music/upload/audio/raw] Received ${body.byteLength} bytes, forwarding to backend`);

    try {
        const response = await fetch(backendUrl, {
            method: "PUT",
            headers,
            body,
            // No explicit Content-Type — let browser set it automatically
            // credentials: 'include' forwards cookies (backend_token) to backend
            credentials: "include",
        });

        const data = await response.json().catch(() => ({ message: "Failed to parse response" }));
        console.log(`[music/upload/audio/raw] Backend response: HTTP ${response.status}`, JSON.stringify(data, null, 2));
        console.log(`[music/upload/audio/raw] FULL backend response:`, data);

        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("[music/upload/audio/raw] Proxy error:", err);
        return NextResponse.json(
            { success: false, message: "Proxy error: " + (err instanceof Error ? err.message : String(err)) },
            { status: 502 }
        );
    }
}
