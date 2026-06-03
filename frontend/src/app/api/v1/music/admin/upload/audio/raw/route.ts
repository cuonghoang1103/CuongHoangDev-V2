import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * Dedicated proxy for RAW BINARY audio uploads.
 *
 * Problem: The catch-all [[...path]] proxy reads body as text() which corrupts
 * binary audio files, AND sets Content-Type: application/json — both cause
 * Supabase to reject the upload with "invalid_mime_type application/json".
 *
 * Solution: This route reads the body as a ReadableStream (raw bytes) and
 * forwards it unchanged. No Content-Type override — let the backend decide.
 *
 * Frontend: PUT /api/v1/music/admin/upload/audio/raw?filename=track.mp3
 * Body: raw binary audio bytes
 */
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("backend_token")?.value;
  const search = request.nextUrl.search;

  const backendUrl = `${BACKEND_URL}/api/v1/music/admin/upload/audio/raw${search}`;

  console.log(`[music/upload/audio/raw] Forwarding raw binary PUT to backend: ${backendUrl}`);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
  };

  // Read body as raw bytes — do NOT read as text() or JSON.stringify()
  const body = await request.arrayBuffer();

  console.log(`[music/upload/audio/raw] Received ${body.byteLength} bytes, forwarding to backend`);

  try {
    const response = await fetch(backendUrl, {
      method: "PUT",
      headers,
      body,
      // Do NOT set Content-Type here — the backend reads raw body with getInputStream()
      // Setting it to anything (especially application/json) breaks Supabase upload
    });

    const data = await response.json().catch(() => ({ message: "Failed to parse response" }));
    console.log(`[music/upload/audio/raw] Backend response: HTTP ${response.status}`, data);

    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[music/upload/audio/raw] Proxy error:", err);
    return NextResponse.json(
      { success: false, message: "Proxy error: " + (err instanceof Error ? err.message : String(err)) },
      { status: 502 }
    );
  }
}
