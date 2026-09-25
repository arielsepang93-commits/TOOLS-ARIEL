document.addEventListener("DOMContentLoaded", () => {
  // 1. Ambil elemen HTML (Gue buat auto-detect biar aman kalau ID lu beda)
  const inputTeks = document.getElementById('teks') || document.querySelector('input[type="text"]');
  const btnGenerate = document.getElementById('generate') || document.querySelector('button');
  const btnReset = document.getElementById('reset') || document.querySelectorAll('button')[1];
  const imgPreview = document.getElementById('preview') || document.querySelector('img');
  const btnDownload = document.getElementById('download') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('DOWNLOAD'));

  if (!inputTeks || !btnGenerate || !imgPreview) {
    console.error("Elemen HTML gak ketemu! Pastikan input, tombol generate, dan tag <img> ada.");
    return;
  }

  // 2. Buat Canvas virtual di memori (Gak perlu nambah tag <canvas> di HTML)
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  // 3. Fungsi Gambar Brat
  function generateBrat() {
    const teks = inputTeks.value.trim() || 'Brat';

    // Bersihkan canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background putih
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Teks gaya Brat
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 60px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Efek blur
    ctx.filter = 'blur(2px)';
    ctx.fillText(teks, canvas.width / 2, canvas.height / 2);
    ctx.filter = 'none'; // Reset blur

    // Ubah jadi gambar dan tampilkan
    const dataUrl = canvas.toDataURL('image/png');
    imgPreview.src = dataUrl;
    imgPreview.style.display = 'block';
    
    return dataUrl;
  }

  // 4. Tombol GENERATE
  btnGenerate.addEventListener('click', (e) => {
    e.preventDefault(); // Biar gak reload halaman
    generateBrat();
  });

  // 5. Tombol RESET
  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      inputTeks.value = '';
      imgPreview.src = '';
      imgPreview.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  // 6. Tombol DOWNLOAD PNG
  if (btnDownload) {
    btnDownload.addEventListener('click', (e) => {
      e.preventDefault();
      const dataUrl = generateBrat(); // Pastikan gambar terbaru yang didownload
      const link = document.createElement('a');
      link.download = `brat-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    });
  }
});
