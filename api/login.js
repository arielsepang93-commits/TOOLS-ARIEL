import { kv } from '@vercel/kv';

const DEFAULT_USERS = {
  'ariel': {
    username: 'Ariel',
    password: 'ariel123',
    role: 'developer',
    registeredAt: '2026-01-01T00:00:00.000Z'
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username & password wajib' });
  }

  const key = 'user:' + username.toLowerCase();
  let user = null;

  try {
    if (DEFAULT_USERS[username.toLowerCase()]) {
      user = DEFAULT_USERS[username.toLowerCase()];
    } else {
      user = await kv.get(key);
    }
  } catch (err) {
    if (DEFAULT_USERS[username.toLowerCase()]) {
      user = DEFAULT_USERS[username.toLowerCase()];
    } else {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
  }

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  }

  const token = Buffer.from(JSON.stringify({
    user: user.username,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 6
  })).toString('base64');

  res.setHeader('Set-Cookie',
    'authToken=' + token + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + (60 * 60 * 6)
  );

  return res.status(200).json({
    success: true,
    message: 'Login berhasil',
    user: user.username,
    role: user.role
  });
}
