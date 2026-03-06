import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const path = request.nextUrl.pathname;

  // 1. Cegat tamu tak diundang (Belum login)
  if (!userId && (path.startsWith('/submit') || path.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Cegah user yang sudah login untuk membuka halaman /login lagi
  if (userId && path.startsWith('/login')) {
    // Admin & Super Admin diarahkan ke /admin
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Teknisi diarahkan ke /submit
    return NextResponse.redirect(new URL('/submit', request.url));
  }

  // 3. ATURAN KETAT ADMIN PORTAL: Hanya role ADMIN dan SUPER_ADMIN yang boleh ke /admin
  if (path.startsWith('/admin') && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/submit', request.url));
  }

  // 4. ATURAN KETAT RESET PAGE: Hanya SUPER_ADMIN yang boleh ke /reset
  if (path.startsWith('/reset') && userRole !== 'SUPER_ADMIN') {
    if (!userId) return NextResponse.redirect(new URL('/login', request.url));
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Memantau rute-rute yang perlu dilindungi
  matcher: ['/submit/:path*', '/admin/:path*', '/login', '/reset/:path*'],
};