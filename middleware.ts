import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Cek KTP (Cookie) pengunjung
  const userId = request.cookies.get('userId')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const path = request.nextUrl.pathname;

  // 2. Cegat tamu tak diundang: Belum login tapi mau masuk halaman dalam
  if (!userId && (path.startsWith('/submit') || path.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Orang pintar: Sudah login tapi iseng buka halaman /login lagi
  if (userId && path.startsWith('/login')) {
    if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.redirect(new URL('/submit', request.url));
  }

  // 4. ATURAN KETAT: Teknisi DILARANG KERAS masuk ke halaman /admin
  if (path.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/submit', request.url)); // Usir balik ke halaman teknisi
  }

  // Jika aman, silakan lewat!
  return NextResponse.next();
}

// Beritahu satpam halaman mana saja yang harus dijaga ketat
export const config = {
  matcher: ['/submit/:path*', '/admin/:path*', '/login'],
};