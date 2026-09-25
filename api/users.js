import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Cek auth
  const cookie = req.headers.cookie || '';
  const tokenMatch = cookie.match(/authToken=([^;]+)/);
  if (!tokenMatch) return res.status(403).json({ success: false, message: 'Unauthorized' });

  try {
    const payload = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString());
    if (payload.role !== 'developer') {
      return res.status(403).json({ success: false, message: 'Hanya developer' });
    }

    const usernames = await kv.smembers('users:all');
    const users = [];
    for (const uname of usernames) {
      const u = await kv.get('user:' + uname);
      if (u) {
        users.push({
          username: u.username,
          role: u.role,
          registeredAt: u.registeredAt
        });
      }
    }

    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
