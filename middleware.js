export const config = {
  matcher: [
    '/dashboard',
    '/dashboard.html',
    '/tools/:path*'
  ]
};

export default function middleware(request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/authToken=([^;]+)/);

  // Tidak ada token → redirect login
  if (!match) {
    return new Response(null, {
      status: 307,
      headers: { 'Location': '/index.html' }
    });
  }

  // Verifikasi token pakai atob (bukan Buffer)
  let payload;
  try {
    const decoded = atob(match[1]);
    payload = JSON.parse(decoded);
  } catch (e) {
    return new Response(null, {
      status: 307,
      headers: { 'Location': '/index.html' }
    });
  }

  if (!payload.exp || payload.exp < Date.now()) {
    return new Response(null, {
      status: 307,
      headers: { 'Location': '/index.html' }
    });
  }

  // Token valid → lanjutkan request (return undefined)
  return undefined;
}
