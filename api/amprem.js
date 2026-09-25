/**
 * NAMA SCRAPE  : Alight Motion Premium Generator
 * ADMIN UTAMA  : Ariel.html
 * PENCIPTA     : Ariel
 * USAGE        : Vercel Serverless Function
 *                Meneruskan request ke https://anita-studio.netlify.app
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const ANITA_API = 'https://anita-studio.netlify.app/.netlify/functions/amprem';

  // Helper untuk memanggil API Anita
  async function callAnita(action, data) {
    const r = await fetch(ANITA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
      signal: AbortSignal.timeout(25000)
    });

    const txt = await r.text();
    let parsed;
    try {
      parsed = JSON.parse(txt);
    } catch (e) {
      parsed = { raw: txt };
    }

    return { ok: r.ok, status: r.status, data: parsed };
  }

  try {
    const action = req.query.action || (req.body && req.body.action);

    // ================= KIRIM MAGIC LINK =================
    if (action === 'kirim-link') {
      const email = req.body?.email || req.query.email;
      if (!email) {
        return res.status(400).json({ sukses: false, pesan: 'Email wajib diisi' });
      }

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

    // ================= VERIFIKASI + AKTIFKAN PREMIUM =================
    if (action === 'verifikasi') {
      const email = req.body?.email || req.query.email;
      const rawLink = req.body?.link || req.body?.rawLink || req.query.link;

      if (!email || !rawLink) {
        return res.status(400).json({ sukses: false, pesan: 'Email dan link wajib diisi' });
      }

      // Step 1: verify-account
      const verifyRes = await callAnita('verify-account', { email, rawLink });

      if (!verifyRes.ok || !verifyRes.data.success) {
        return res.status(500).json({
          sukses: false,
          pesan: verifyRes.data.message || 'Verifikasi gagal',
          detail: verifyRes.data
        });
      }

      const idToken = verifyRes.data.idToken || verifyRes.data.profile?.idToken;

      if (!idToken) {
        return res.status(500).json({
          sukses: false,
          pesan: 'idToken tidak ditemukan dari verifikasi',
          detail: verifyRes.data
        });
      }

      // Step 2: apply-premium
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

    return res.status(404).json({ sukses: false, pesan: 'Action tidak ditemukan' });

  } catch (error) {
    console.error('AMPrem error:', error);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ sukses: false, pesan: 'Request timeout' });
    }
    return res.status(500).json({ sukses: false, pesan: 'Server error: ' + error.message });
  }
}
