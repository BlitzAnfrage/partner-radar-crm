import { NextResponse } from "next/server";
import { adminSessionCookieName, createAdminSessionToken, getAdminPassword } from "@/lib/auth/session";

export async function POST(request: Request) {
  let expectedPassword: string;

  try {
    expectedPassword = getAdminPassword();
  } catch {
    return NextResponse.json({ error: "Missing CRM_ADMIN_PASSWORD server configuration" }, { status: 500 });
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(String(formData.get("next") ?? "/"));

  if (password !== expectedPassword) {
    return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(next)}`, request.url), {
      status: 303
    });
  }

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  response.cookies.set({
    name: adminSessionCookieName,
    value: await createAdminSessionToken(expectedPassword),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}

function sanitizeNext(next: string) {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/api/")) return "/";
  return next;
}
