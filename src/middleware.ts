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
    
    if (isAdmin || isAttendanceTaker) {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/student', request.url));
    }
  }

  // If trying to access protected path without token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If trying to access admin path without admin privileges, check for attendance taker
  if (path.startsWith('/admin') && request.cookies.get('isAdmin')?.value !== 'true' && request.cookies.get('isAttendanceTaker')?.value !== 'true') {
    return NextResponse.redirect(new URL('/student', request.url));
  }
  
  // If admin or attendance taker is trying to access student pages, redirect to admin
  if (path.startsWith('/student') && (request.cookies.get('isAdmin')?.value === 'true' || request.cookies.get('isAttendanceTaker')?.value === 'true')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // If regular student is trying to access attendance-taker pages, redirect to student
  if (path.startsWith('/attendance-taker') && request.cookies.get('isAttendanceTaker')?.value !== 'true' && request.cookies.get('isAdmin')?.value !== 'true') {
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
    '/attendance-taker',
    '/attendance-taker/:path*',
  ],
};
