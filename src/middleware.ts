import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Define public paths
  const isPublicPath = path === '/';

  // Get the token from session storage
  const token = request.cookies.get('token')?.value || '';

  // If trying to access public path with token, redirect to appropriate dashboard
  if (isPublicPath && token) {
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';
    const isAttendanceTaker = request.cookies.get('isAttendanceTaker')?.value === 'true';
    
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (isAttendanceTaker) {
      return NextResponse.redirect(new URL('/attendance-takers', request.url));
    } else {
      return NextResponse.redirect(new URL('/student', request.url));
    }
  }

  // If trying to access protected path without token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If trying to access admin path without admin privileges
  if (path.startsWith('/admin') && request.cookies.get('isAdmin')?.value !== 'true') {
    // If they're an attendance taker, redirect to their page
    if (request.cookies.get('isAttendanceTaker')?.value === 'true') {
      return NextResponse.redirect(new URL('/attendance-takers', request.url));
    }
    // If they're a regular student, redirect to student page
    return NextResponse.redirect(new URL('/student', request.url));
  }
  
  // If admin is trying to access student pages, redirect to admin
  if (path.startsWith('/student') && request.cookies.get('isAdmin')?.value === 'true') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // If attendance taker is trying to access student pages, redirect to attendance-takers
  if (path.startsWith('/student') && request.cookies.get('isAttendanceTaker')?.value === 'true') {
    return NextResponse.redirect(new URL('/attendance-takers', request.url));
  }

  // If regular student is trying to access attendance-takers pages, redirect to student
  if (path.startsWith('/attendance-takers') && request.cookies.get('isAttendanceTaker')?.value !== 'true' && request.cookies.get('isAdmin')?.value !== 'true') {
    return NextResponse.redirect(new URL('/student', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/',
    '/admin',
    '/admin/:path*',
    '/student',
    '/student/:path*',
    '/attendance-takers',
    '/attendance-takers/:path*',
  ],
};
