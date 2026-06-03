import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * Server-side music upload proxy.
 *
 * Flow:
 *  1. Verify auth from Authorization header or backend_token cookie.
 *  2. Forward multipart/form-data to backend POST /api/v1/music/admin/upload.
 *  3. Backend streams audio to Supabase and saves DB record.
 *     Server-to-server call — no Vercel 4.5MB browser limit.
 *  4. Always log raw response text so we can diagnose errors.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const start = Date.now();
    console.log(`[music/upload] ===== ENTRY =====`);

    try {
        // 1. Auth resolution
        let token = request.headers.get("Authorization")?.replace("Bearer ", "").trim();
        if (!token) token = request.cookies.get("backend_token")?.value || "";
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized: không có token xác thực" },
                { status: 401 }
            );
        }

        // 2. Read multipart form data
        const formData = await request.formData();
        const file = formData.get("audio") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, message: "Không có file audio được gửi lên" },
                { status: 400 }
            );
        }

        const title = (formData.get("title") as string) || "";
        const artist = (formData.get("artist") as string) || "";
        const durationSeconds = parseInt((formData.get("durationSeconds") as string) || "0", 10);

        console.log(`[music/upload] File: ${file.name} (${file.size} bytes)`);
        console.log(`[music/upload] Title: "${title}", Artist: "${artist}", Duration: ${durationSeconds}s`);

        // 3. Forward to backend — NO Content-Type header (browser sets multipart boundary)
        const backendRes = await fetch(`${BACKEND_URL}/api/v1/music/admin/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const elapsed = Date.now() - start;
        const rawText = await backendRes.text(); // Always read as text first for logging

        console.log(`[music/upload] Backend response: HTTP ${backendRes.status} (${elapsed}ms)`);
        console.log(`[music/upload] Raw response body (${rawText.length} chars):`, rawText.slice(0, 500));

        // 4. Try to parse JSON; if it looks like HTML, return a helpful error
        let data: Record<string, unknown>;
        try {
            data = JSON.parse(rawText);
        } catch {
            // Not JSON — likely HTML error page from Spring Boot
            const looksLikeHtml = rawText.trim().startsWith("<");
            if (looksLikeHtml) {
                console.error(`[music/upload] Backend returned HTML (not JSON) — status: ${backendRes.status}`);
                return NextResponse.json(
                    {
                        success: false,
                        message: `Lỗi backend (HTTP ${backendRes.status}): Phản hồi không phải JSON. Xem log backend để biết chi tiết.`,
                    },
                    { status: backendRes.status }
                );
            }
            return NextResponse.json(
                {
                    success: false,
                    message: `Phản hồi backend không hợp lệ: ${rawText.slice(0, 100)}`,
                },
                { status: backendRes.status }
            );
        }

        // 5. Return backend response as-is to frontend
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        const elapsed = Date.now() - start;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[music/upload] FAILED (${elapsed}ms):`, msg);
        return NextResponse.json(
            {
                success: false,
                message: `Lỗi proxy: ${msg}`,
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
