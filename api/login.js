export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username & password wajib' });
  }

  // Database user (bisa diganti DB nanti)
  const USERS = [
    { username: 'Ariel', password: 'ariel123', role: 'developer' }
  ];

  const user = USERS.find(u =>
    u.username.toLowerCase() === username.toLowerCase() &&
    u.password === password
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  }

  // Token base64 (untuk produksi, ganti ke JWT)
  const token = Buffer.from(
    JSON.stringify({
      user: user.username,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 6
    })
  ).toString('base64');

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
