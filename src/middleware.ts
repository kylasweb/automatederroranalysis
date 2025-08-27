import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for public routes and admin routes (no auth required)
  const publicPaths = ['/login', '/api/auth/login', '/api/health', '/api/analyze-log', '/', '/admin'];
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path) ||
    request.nextUrl.pathname === path
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Allow all admin routes without authentication
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  if (isAdminPath) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};