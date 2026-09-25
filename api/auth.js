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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const action = req.query.action || (req.body && req.body.action);

  // ============ LOGIN ============
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

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

  // ============ REGISTER ============
  if (action === 'register') {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username & password wajib' });
    }
    if (username.length < 3) {
      return res.status(400).json({ success: false, message: 'Username minimal 3 karakter' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    const key = 'user:' + username.toLowerCase();

    try {
      const existing = await kv.get(key);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Username sudah terdaftar' });
      }

      const userData = {
        username: username,
        password: password,
        role: 'member',
        registeredAt: new Date().toISOString()
      };

      await kv.set(key, userData);
      await kv.sadd('users:all', username.toLowerCase());

      return res.status(201).json({
        success: true,
        message: 'Akun berhasil dibuat',
        user: username
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
  }

  // ============ LOGOUT ============
  if (action === 'logout') {
    res.setHeader('Set-Cookie', 'authToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    return res.status(200).json({ success: true, message: 'Logout berhasil' });
  }

  // ============ LIST USERS (Developer only) ============
  if (action === 'users') {
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
        if (u) users.push({ username: u.username, role: u.role, registeredAt: u.registeredAt });
      }

      return res.status(200).json({ success: true, users });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(404).json({ success: false, message: 'Action tidak ditemukan' });
}
