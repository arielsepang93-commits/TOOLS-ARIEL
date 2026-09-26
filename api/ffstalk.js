export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const userId = req.query.userId || req.query.uid;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'Parameter userId wajib diisi' });
  }

  const url = 'https://api.saipulanuar.eu.org/api/stalkgame/ffstalk1?userId=' + encodeURIComponent(userId);

  try {
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
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({ success: false, message: 'Response bukan JSON', raw: text.substring(0, 200) });
    }

    return res.status(200).json(data);

  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'Request timeout.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal: ' + error.message });
  }
}
