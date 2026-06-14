import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith('/admin') && token?.role !== 'ADMIN' && token?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (path.startsWith('/dashboard') && !token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/exams') || path.startsWith('/profile')) {
          return !!token;
        }
        return true;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: '/login' },
  },
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/exams/:path*',
    '/profile/:path*',
    '/courses/:path*/learn',
  ],
};
