/**
 * File  : api/brat.js
 * Fungsi: Proxy ke XyloAPI Brat Generator
 * Source: https://xyloapi.qzz.io/api/maker/brat
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const text = req.query.text;

  if (!text) {
    return res.status(400).json({ success: false, message: 'Parameter text wajib diisi' });
  }

  try {
    const apiUrl = 'https://xyloapi.qzz.io/api/maker/brat?text=' + encodeURIComponent(text);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'image/*, application/json, text/html, */*'
      },
      signal: AbortSignal.timeout(25000)
    });

    const contentType = response.headers.get('content-type') || '';

    // Kalau respons berupa gambar langsung
    if (contentType.startsWith('image/')) {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(Buffer.from(buffer));
    }

    // Kalau respons JSON
    const textResp = await response.text();
    try {
      const parsed = JSON.parse(textResp);
      return res.status(200).json(parsed);
    } catch (e) {
      // Kalau HTML / bukan JSON, balikin JSON biar frontend bisa handle
      return res.status(200).json({
        success: false,
        message: 'Response tidak dikenali',
        raw: textResp.substring(0, 300)
      });
    }

  } catch (error) {
    console.error('Brat error:', error.message);

    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'Request timeout' });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal: ' + error.message
    });
  }
}
