document.addEventListener("DOMContentLoaded", () => {
  // 1. Ambil elemen HTML (Auto-detect biar aman)
  const inputTeks = document.getElementById('teks') || document.querySelector('input[type="text"]');
  const btnGenerate = document.getElementById('generate') || document.querySelector('button');
  const btnReset = document.getElementById('reset') || document.querySelectorAll('button')[1];
  const imgPreview = document.getElementById('preview') || document.querySelector('img');
  const btnDownload = document.getElementById('download') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('DOWNLOAD'));

  if (!inputTeks || !btnGenerate || !imgPreview) {
    console.error("Elemen HTML gak ketemu! Cek ID input, tombol, dan tag img.");
    return;
  }

  // 2. Fungsi Generate
  async function generateBrat() {
    const teks = inputTeks.value.trim() || 'Brat';
    
    // Set loading state
    imgPreview.src = '';
    imgPreview.alt = 'Loading...';
    imgPreview.style.display = 'block';
    imgPreview.style.backgroundColor = '#333';

    try {
      // 3. Panggil API XyloAPI LANGSUNG
      const apiUrl = `https://xyloapi.qzz.io/api/maker/brat?text=${encodeURIComponent(teks)}`;
      const response = await fetch(apiUrl);

      // Cek status HTTP
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // 4. Parse JSON
      const data = await response.json();
      console.log("Respons XyloAPI:", data); // Cek di console buat debug

      // 5. EKSTRAK URL GAMBAR (Kunci utamanya ada di data.data.image)
      if (!data.success || !data.data || !data.data.image) {
        throw new Error("Format respons API tidak sesuai atau gambar tidak tersedia");
      }

      // 6. Tampilkan gambar
      imgPreview.src = data.data.image;
      imgPreview.alt = 'Hasil Brat';
      imgPreview.style.backgroundColor = 'transparent';

    } catch (error) {
      console.error("Error:", error);
      // Tampilkan pesan error asli, bukan cuma "Gambar tidak tersedia"
      imgPreview.alt = `GAGAL: ${error.message}`;
      imgPreview.src = '';
      imgPreview.style.backgroundColor = '#ffcccc';
    }
  }

  // 7. Event Listeners
  btnGenerate.addEventListener('click', (e) => {
    e.preventDefault();
    generateBrat();
  });

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

  if (btnDownload) {
    btnDownload.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!imgPreview.src) return alert("Generate dulu bre!");
      
      try {
        // Fetch gambarnya buat di-download (biar gak kena CORS download)
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
