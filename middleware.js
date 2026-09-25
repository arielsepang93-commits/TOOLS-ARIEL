import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard.html',
    '/tools/:path*'
  ]
};

export function middleware(req) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/authToken=([^;]+)/);

  // Tidak ada token → redirect ke login
  if (!match) {
    return NextResponse.redirect(new URL('/index.html', req.url));
  }

  // Verifikasi token
  let payload;
  try {
    payload = JSON.parse(Buffer.from(match[1], 'base64').toString('utf-8'));
  } catch (e) {
    return NextResponse.redirect(new URL('/index.html', req.url));
  }

  if (!payload.exp || payload.exp < Date.now()) {
    return NextResponse.redirect(new URL('/index.html', req.url));
  }

  // Token valid → lanjut
  return NextResponse.next();
}
