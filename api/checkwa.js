export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const phone = req.query.phone;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Parameter phone wajib diisi' });
  }

  const API_KEY = 'sylva-B1sgptvl';
  const url = 'https://sylvatica.my.id/api/tools/checkwa?phone=' +
    encodeURIComponent(phone) + '&apikey=' + API_KEY;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(20000)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Response bukan JSON', raw: text });
    }

    if (data.status === false) {
      return res.status(200).json({
        success: false,
        message: data.message || 'Gagal memproses'
      });
    }

    const result = data.result || data.data || data;

    return res.status(200).json({
      success: true,
      creator: 'Ariel',
      result: {
        banned: result.banned,
        info: {
          device: result.info ? result.info.device : 'Unknown',
          email: result.info ? result.info.email : 'Unknown'
        },
        number: result.number,
        status: result.status
      }
    });

  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'Request timeout' });
    }
    return res.status(500).json({ success: false, message: 'Gagal: ' + error.message });
  }
} 
