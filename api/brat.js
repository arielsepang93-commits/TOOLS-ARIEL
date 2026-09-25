document.addEventListener("DOMContentLoaded", () => {
  const inputTeks = document.getElementById('teks') || document.querySelector('input[type="text"]');
  const btnGenerate = document.getElementById('generate') || document.querySelector('button');
  const btnReset = document.getElementById('reset') || document.querySelectorAll('button')[1];
  const imgPreview = document.getElementById('preview') || document.querySelector('img');
  const btnDownload = document.getElementById('download') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('DOWNLOAD'));

  if (!inputTeks || !btnGenerate || !imgPreview) {
    console.error("Elemen HTML gak ketemu! Cek ID input, tombol generate, dan tag img.");
    return;
  }

  // FUNGSI GENERATE (PAKE API)
  async function generateBrat() {
    const teks = inputTeks.value.trim() || 'Brat';
    
    // Kasih feedback ke user kalau lagi loading
    imgPreview.src = ''; 
    imgPreview.alt = 'Loading...';
    imgPreview.style.display = 'block';
    imgPreview.style.backgroundColor = '#333';

    try {
      // GANTI '/api/generate' INI DENGAN URL API LU YANG SEBENERNYA
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: teks })
      });

      // 1. Cek status HTTP dulu
      if (!response.ok) {
        // Baca sebagai teks (HTML error) supaya ketahuan salahnya dimana
        const errorHtml = await response.text();
        console.error("Isi Error dari Server:", errorHtml);
        throw new Error(`Server Error ${response.status}. Buka Console/Log Vercel untuk detail.`);
      }

      // 2. Cek Content-Type, pastikan JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Respons bukan JSON:", textResponse);
        throw new Error("Server ngirim HTML, bukan JSON. Backend lu crash.");
      }

      // 3. Baru parse JSON dengan aman
      const data = await response.json();
      
      // Sesuaikan 'data.url' dengan struktur JSON API lu
      // (Misal: data.image, data.data.url, data.result, dll)
      const imageUrl = data.url || data.image || data.data; 
      
      if (!imageUrl) {
        throw new Error("API sukses tapi URL gambar gak ketemu di respons.");
      }

      // Tampilkan gambar
      imgPreview.src = imageUrl;
      imgPreview.alt = 'Hasil Brat';
      imgPreview.style.backgroundColor = 'transparent';

    } catch (error) {
      console.error(error);
      // Tampilkan pesan error spesifik, bukan "Gagal load gambar" doang
      imgPreview.alt = `GAGAL: ${error.message}`;
      imgPreview.src = ''; // Kosongin gambar
      imgPreview.style.backgroundColor = '#ffcccc'; // Background merah tanda error
    }
  }

  // TOMBOL GENERATE
  btnGenerate.addEventListener('click', (e) => {
    e.preventDefault();
    generateBrat();
  });

  // TOMBOL RESET
  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      inputTeks.value = '';
      imgPreview.src = '';
      imgPreview.alt = '';
      imgPreview.style.display = 'none';
      imgPreview.style.backgroundColor = 'transparent';
    });
  }

  // TOMBOL DOWNLOAD
  if (btnDownload) {
    btnDownload.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!imgPreview.src) return alert("Generate dulu bre!");
      
      try {
        // Fetch gambarnya buat di-download (biar gak kena CORS)
        const res = await fetch(imgPreview.src);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `brat-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url); // Bersihin memori
      } catch (err) {
        alert("Gagal download: " + err.message);
      }
    });
  }
});
