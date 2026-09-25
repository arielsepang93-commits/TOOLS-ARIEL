document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas"); // Pastikan ID sesuai HTML Anda
  const ctx = canvas.getContext("2d");
  const textInput = document.getElementById("text-input"); // Sesuaikan ID
  const generateBtn = document.getElementById("generate-btn"); // Sesuaikan ID
  const downloadBtn = document.getElementById("download-btn"); // Sesuaikan ID
  const preview = document.getElementById("preview"); // Sesuaikan ID (tag <img>)

  if (!canvas || !textInput || !generateBtn) {
    console.error("Elemen HTML tidak ditemukan! Cek ID di HTML Anda.");
    return;
  }

  // Fungsi Generate Brat
  function generateBrat() {
    const text = textInput.value.trim() || "Tets";

    // 1. PENTING: Bersihkan canvas setiap kali generate baru (Mencegah memory leak & error di HP)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Gambar background putih
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Gambar teks (Brat Style)
    ctx.fillStyle = "#000000";
    // Gunakan font standar sistem, jangan load font eksternal biar gak gagal
    ctx.font = "bold 60px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Efek blur khas Brat
    ctx.filter = "blur(2px)";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Reset filter
    ctx.filter = "none";

    // 4. Tampilkan ke layar pakai toDataURL (JANGAN pakai createObjectURL, sering expired di HP)
    try {
      const dataUrl = canvas.toDataURL("image/png");
      if (preview) {
        preview.src = dataUrl;
        preview.style.display = "block";
      }
      if (downloadBtn) {
        downloadBtn.style.display = "block";
        // Hapus event lama jika ada, lalu pasang baru
        downloadBtn.onclick = () => {
          const link = document.createElement("a");
          link.download = "brat-" + Date.now() + ".png";
          link.href = dataUrl;
          link.click();
        };
      }
    } catch (error) {
      console.error("Gagal export canvas:", error);
      alert("Gagal membuat gambar. Coba refresh halaman.");
    }
  }

  // Pasang event listener
  generateBtn.addEventListener("click", generateBrat);
});
