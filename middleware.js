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

  if (!match) {
    return new Response(null, { status: 307, headers: { 'Location': '/index.html' } });
  }

  let payload;
  try {
    payload = JSON.parse(atob(match[1]));
  } catch (e) {
    return new Response(null, { status: 307, headers: { 'Location': '/index.html' } });
  }

  if (!payload.exp || payload.exp < Date.now()) {
    return new Response(null, { status: 307, headers: { 'Location': '/index.html' } });
  }

  return undefined;
}
