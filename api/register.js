import { kv } from '@vercel/kv';

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
    return res.status(500).json({
      success: false,
      message: 'Database error: ' + err.message
    });
  }
}
