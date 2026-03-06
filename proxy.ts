import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export async function proxy(request: NextRequest) {
    const sessionCookie = request.cookies.get('session');
    let session = null;

    if (sessionCookie) {
        session = await decrypt(sessionCookie.value);
    }

    const { pathname } = request.nextUrl;

    // Protect /admin routes
    if (pathname.startsWith('/admin')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (session.userRole !== 'ADMIN' && session.userRole !== 'SUPER_ADMIN') {
            // If a technician tries to access admin, redirect to submit
            return NextResponse.redirect(new URL('/submit', request.url));
        }
    }

    // Protect /submit routes
    if (pathname.startsWith('/submit')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (session.userRole === 'ADMIN' || session.userRole === 'SUPER_ADMIN') {
            // If an admin tries to access submit, redirect to admin
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    // Redirect root to login or appropriate dashboard
    if (pathname === '/') {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        } else if (session.userRole === 'ADMIN' || session.userRole === 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/admin', request.url));
        } else {
            return NextResponse.redirect(new URL('/submit', request.url));
        }
    }

    // Block logged-in users from /login
    if (pathname === '/login' && session) {
        if (session.userRole === 'ADMIN' || session.userRole === 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/admin', request.url));
        } else {
            return NextResponse.redirect(new URL('/submit', request.url));
        }
    }

    // Protect /profile
    if (pathname.startsWith('/profile') && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect /reset
    if (pathname.startsWith('/reset')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (session.userRole !== 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
