import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  verifySession,
  canAccess,
  firstPage,
} from "@/lib/adminAuth";

/**
 * Gate every dashboard route: must have a valid signed session, and the
 * session's role must be allowed to reach that path. Otherwise bounce to login
 * or to the role's first allowed page.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!canAccess(session.role, pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = firstPage(session.role);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except the login page, API routes and Next internals/static.
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
