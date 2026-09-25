/**
 * File  : api/spotify.js
 * Fungsi: Proxy + Normalize XyloAPI Spotify Downloader
 */

function findDownloadUrl(raw) {
  if (!raw || typeof raw !== 'object') return '';

  // Cek field langsung
  var candidates = [
    raw.download,
    raw.download_url,
    raw.downloadUrl,
    raw.url_audio,
    raw.urlAudio,
    raw.audio,
    raw.audio_url,
    raw.audioUrl,
    raw.mp3,
    raw.mp3_url,
    raw.link,
    raw.link_download,
    raw.url
  ];

  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    if (typeof c === 'string' && c.startsWith('http')) return c;
    // Kalau c berupa object, cari di dalam
    if (c && typeof c === 'object') {
      var inner = c.mp3 || c.url || c.link || c.audio || c.download || c.href;
      if (typeof inner === 'string' && inner.startsWith('http')) return inner;
    }
  }

  // Cek array downloads / medias
  var arrs = [raw.downloads, raw.medias, raw.media, raw.links, raw.formats];
  for (var k = 0; k < arrs.length; k++) {
    var arr = arrs[k];
    if (Array.isArray(arr)) {
      for (var j = 0; j < arr.length; j++) {
        var item = arr[j];
        if (typeof item === 'string' && item.startsWith('http')) return item;
        if (item && typeof item === 'object') {
          var u = item.url || item.link || item.href || item.download;
          if (typeof u === 'string' && u.startsWith('http')) return u;
        }
      }
    }
  }

  // Cari rekursif di semua value
  for (var key in raw) {
    if (raw.hasOwnProperty(key)) {
      var v = raw[key];
      if (typeof v === 'string' && v.startsWith('http') && (
        key.toLowerCase().includes('download') ||
        key.toLowerCase().includes('audio') ||
        key.toLowerCase().includes('mp3') ||
        key.toLowerCase().includes('link') ||
        key.toLowerCase().includes('url')
      )) {
        return v;
      }
    }
  }

  return '';
}

function normalizeTrack(data) {
  var raw = data.result || data.data || data;

  var dlUrl = findDownloadUrl(raw);

  // Artist bisa array atau string
  var artist = raw.artist || raw.artists || raw.creator || raw.author || raw.channel || 'Unknown Artist';
  if (Array.isArray(artist)) {
    artist = artist.map(function(a) {
      return typeof a === 'object' ? (a.name || a.title || '') : a;
    }).filter(Boolean).join(', ');
  } else if (typeof artist === 'object') {
    artist = artist.name || artist.title || 'Unknown Artist';
  }

  // Duration
  var duration = raw.duration || raw.length || raw.duration_ms || '-';
  if (typeof duration === 'number' && duration > 1000) {
    var totalSec = Math.floor(duration / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    duration = m + ':' + (s < 10 ? '0' : '') + s;
  }

  return {
    title: raw.title || raw.name || raw.track || raw.song || 'Unknown Title',
    artist: artist,
    thumbnail: raw.thumbnail || raw.image || raw.cover || raw.album_art || raw.albumArt || '',
    duration: duration,
    album: raw.album || raw.album_name || '',
    description: raw.description || raw.desc || '',
    download: dlUrl,
    raw: raw
  };
}

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

  if (!url) return res.status(400).json({ success: false, message: 'Parameter url wajib diisi' });
  if (!url.includes('spotify.com')) return res.status(400).json({ success: false, message: 'URL harus dari Spotify' });

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
    try { data = JSON.parse(textResp); } catch (e) {
      return res.status(500).json({ success: false, message: 'Response bukan JSON', raw: textResp.substring(0, 300) });
    }

    // Cek status API
    if (data.status === false || data.success === false) {
      return res.status(200).json({
        success: false,
        message: data.message || data.msg || 'API gagal memproses'
      });
    }

    const normalized = normalizeTrack(data);

    return res.status(200).json({
      success: true,
      result: normalized
    });

  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'Request timeout' });
    }
    return res.status(500).json({ success: false, message: 'Gagal: ' + error.message });
  }
}
