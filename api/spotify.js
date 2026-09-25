/**
 * File  : api/spotify.js
 * Fungsi: Proxy ke XyloAPI Spotify Downloader
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const url = req.query.url;
  const server = req.query.server || 'server1';

  if (!url) {
    return res.status(400).json({ success: false, message: 'Parameter url wajib diisi' });
  }

  if (!url.includes('spotify.com')) {
    return res.status(400).json({ success: false, message: 'URL harus dari Spotify' });
  }

  try {
    const apiUrl = 'https://xyloapi.qzz.io/api/downloader/spotify?url=' +
      encodeURIComponent(url) + '&server=' + encodeURIComponent(server);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      signal: AbortSignal.timeout(30000)
    });

    const textResp = await response.text();
    let data;
    try {
      data = JSON.parse(textResp);
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: 'Response bukan JSON',
        raw: textResp.substring(0, 300)
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Spotify error:', error.message);

    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'Request timeout' });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal: ' + error.message
    });
  }
}
