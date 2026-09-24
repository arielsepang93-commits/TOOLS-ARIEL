export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ambil parameter url
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Parameter url wajib diisi' });
  }

  // Validasi URL
  let targetUrl;
  try {
    targetUrl = new URL(url);
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      throw new Error('Protokol tidak didukung');
    }
  } catch (e) {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  try {
    // Fetch HTML dari website target
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Website mengembalikan status ' + response.status
      });
    }

    const html = await response.text();

    // Limit ukuran 4 MB
    if (html.length > 4 * 1024 * 1024) {
      return res.status(413).json({ error: 'Website terlalu besar (>4MB)' });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ error: 'Website timeout (lebih dari 8 detik)' });
    }
    return res.status(500).json({ error: 'Gagal ambil website: ' + err.message });
  }
}

export const config = {
  runtime: 'edge'
};
