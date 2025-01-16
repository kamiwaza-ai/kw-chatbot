// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookie } from '@/lib/auth/cookies';
import { verifyKamiwazaToken } from '@/lib/auth/kamiwaza';

export async function middleware(request: NextRequest) {
  // Get the path
  const path = request.nextUrl.pathname;

  // Paths that don't require authentication
  if (path === '/login') {
    // If user is already authenticated, redirect to home
    const token = await getAuthCookie();
    if (token) {
      try {
        await verifyKamiwazaToken(token);
        return NextResponse.redirect(new URL('/', request.url));
      } catch {
        // Token is invalid, continue to login page
      }
    }
    return NextResponse.next();
  }

  // Check for auth token
  const token = await getAuthCookie();
  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify token with Kamiwaza
    await verifyKamiwazaToken(token);
    return NextResponse.next();
  } catch (error) {
    // Token is invalid, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Update matcher to exclude static files and only include the paths we want to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - api/auth (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)',
  ],
};