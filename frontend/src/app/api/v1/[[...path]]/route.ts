import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * ALL backend API calls go through this proxy route: /api/v1/*
 * The browser attaches the backend_token from the httpOnly cookie automatically.
 * We additionally pass it as Authorization: Bearer header to satisfy JwtAuthenticationFilter
 * (which reads from the Authorization header, not from cookies).
 *
 * Frontend code calls: /api/v1/courses, /api/v1/admin/users, etc.
 * This route proxies to: https://backend.com/api/v1/courses, etc.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("backend_token")?.value;
  const path = request.nextUrl.pathname.replace("/api/v1", "");
  const search = request.nextUrl.search;

  const response = await fetch(`${BACKEND_URL}/api/v1${path}${search}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("backend_token")?.value;
  const path = request.nextUrl.pathname.replace("/api/v1", "");
  const search = request.nextUrl.search;
  const body = await request.text();

  const response = await fetch(`${BACKEND_URL}/api/v1${path}${search}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("backend_token")?.value;
  const path = request.nextUrl.pathname.replace("/api/v1", "");
  const search = request.nextUrl.search;
  const body = await request.text();

  const response = await fetch(`${BACKEND_URL}/api/v1${path}${search}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get("backend_token")?.value;
  const path = request.nextUrl.pathname.replace("/api/v1", "");
  const search = request.nextUrl.search;
  const body = await request.text();

  const response = await fetch(`${BACKEND_URL}/api/v1${path}${search}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("backend_token")?.value;
  const path = request.nextUrl.pathname.replace("/api/v1", "");
  const search = request.nextUrl.search;

  const response = await fetch(`${BACKEND_URL}/api/v1${path}${search}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
