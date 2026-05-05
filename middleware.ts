import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, isValidAdminSession } from "@/lib/auth/session";

const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout", "/api/imports/osm-leads"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname === "/login" && (await hasValidSession(request))) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!(await hasValidSession(request))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

async function hasValidSession(request: NextRequest) {
  try {
    return isValidAdminSession(request.cookies.get(adminSessionCookieName)?.value);
  } catch {
    return false;
  }
}
