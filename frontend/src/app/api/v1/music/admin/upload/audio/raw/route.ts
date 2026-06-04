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
 * Auth: reads from the httpOnly backend_token cookie.
 *
 * Frontend: PUT /api/v1/music/admin/upload/audio/raw?filename=track.mp3
 * Body: raw binary audio bytes
 */
export const runtime = 'nodejs';
const isDebug = process.env.NODE_ENV !== 'production';

function debugLog(...args: unknown[]) {
  if (isDebug) console.log('[music/upload/audio/raw]', ...args);
}

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

    const token = request.cookies.get("backend_token")?.value || "";
    const backendUrl = `${BACKEND_URL}/api/v1/music/admin/upload/audio/raw${search}`;
    debugLog('Forwarding raw binary PUT to:', backendUrl);

    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const body = await request.arrayBuffer();
    debugLog(`Received ${body.byteLength} bytes`);

    try {
        const response = await fetch(backendUrl, {
            method: "PUT",
            headers,
            body,
            credentials: "include",
        });

        const data = await response.json().catch(() => ({ message: "Failed to parse response" }));
        debugLog('Backend response: HTTP', response.status);

        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        console.error("[music/upload/audio/raw] Proxy error:", err);
        return NextResponse.json(
            { success: false, message: "Proxy error: " + (err instanceof Error ? err.message : String(err)) },
            { status: 502 }
        );
    }
}
