export default async function handler(req, res) {
  // 1. Hanya terima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method tidak diizinkan' });
  }

  try {
    // 2. Ambil input teks dari frontend
    const { text } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Teks tidak boleh kosong' });
    }

    // 3. Panggil API XyloAPI
    const apiUrl = `https://xyloapi.qzz.io/api/maker/brat?text=${encodeURIComponent(text)}`;
    
    const response = await fetch(apiUrl);
    
    // Cek apakah request ke API berhasil
    if (!response.ok) {
      throw new Error(`XyloAPI Error: ${response.status} ${response.statusText}`);
    }

    // 4. Parse JSON dari API
    const data = await response.json();

    // 5. Cek apakah API mengembalikan success: true
    if (!data.success || !data.data || !data.data.image) {
      throw new Error('API tidak mengembalikan URL gambar');
    }

    // 6. Kembalikan URL gambar ke frontend
    return res.status(200).json({
      success: true,
      url: data.data.image // <-- Ambil dari data.image
    });

  } catch (error) {
    // 7. KUNCI UTAMA: Tangkap error dan kembalikan sebagai JSON
    console.error("Backend Error:", error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message || "Terjadi kesalahan di server"
    });
  }
}
