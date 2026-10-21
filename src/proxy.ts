import { NextResponse, type NextRequest } from "next/server"

// Guard awal berbasis keberadaan cookie refresh (httpOnly).
// Keamanan sebenarnya tetap di API — proxy ini hanya mencegah
// halaman protected tampil sebelum sesi diperiksa.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("refresh_token")
  const isLoginPage = request.nextUrl.pathname === "/login"

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
