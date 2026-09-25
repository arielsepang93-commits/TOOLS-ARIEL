export default async function handler(req, res) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();

    try {
        // Ambil action dari query atau body
        const action = req.query.action || (req.body && req.body.action);

        // ============================================
        // 1. KIRIM MAGIC LINK
        // ============================================
        if (action === "kirim-link") {
            // Ambil email dari query (GET) atau body (POST)
            const email = req.query.email || (req.body && req.body.email);
            if (!email) {
                return res.status(400).json({ sukses: false, pesan: "Email wajib diisi" });
            }

            const apiUrl = "https://am-premiumms.vercel.app/api/send-magic-link";
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S908E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                    "Accept": "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                    "Origin": "https://am-premiumms.vercel.app",
                    "Referer": "https://am-premiumms.vercel.app/"
                },
                body: JSON.stringify({ email: email }),
                signal: AbortSignal.timeout(20000)
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { raw: text };
            }

            if (!response.ok) {
                return res.status(response.status).json({
                    sukses: false,
                    pesan: "Gagal mengirim magic link",
                    detail: data
                });
            }

            return res.status(200).json({
                sukses: true,
                pesan: `Link verifikasi instan telah dikirim ke ${email}. Cek inbox atau folder spam.`,
                data: data
            });
        }

        // ============================================
        // 2. VERIFIKASI & AKTIFKAN PREMIUM
        // ============================================
        if (action === "verifikasi") {
            // Ambil dari query (GET) atau body (POST)
            const email = req.query.email || (req.body && req.body.email);
            const link = req.query.link || (req.body && req.body.link);

            if (!email || !link) {
                return res.status(400).json({ sukses: false, pesan: "Email dan link wajib diisi" });
            }

            // Ekstrak oobCode jika link panjang
            let oobCode = link.trim();
            if (oobCode.includes("oobCode=")) {
                try {
                    const url = new URL(oobCode);
                    oobCode = url.searchParams.get("oobCode");
                } catch (e) {}
            }

            if (!oobCode) {
                return res.status(400).json({ sukses: false, pesan: "oobCode tidak valid" });
            }

            const apiUrl = "https://am-premiumms.vercel.app/api/verify-oobcode";
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S908E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                    "Accept": "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                    "Origin": "https://am-premiumms.vercel.app",
                    "Referer": "https://am-premiumms.vercel.app/"
                },
                body: JSON.stringify({ email: email, oobCode: oobCode }),
                signal: AbortSignal.timeout(20000)
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { raw: text };
            }

            if (!response.ok) {
                return res.status(response.status).json({
                    sukses: false,
                    pesan: "Gagal verifikasi oobCode",
                    detail: data
                });
            }

            return res.status(200).json({
                sukses: true,
                pesan: "Verifikasi berhasil, Alight Motion Premium VIP aktif 1 Tahun!",
                data: {
                    email_target: email,
                    uid_firebase: data.uid || data.userId || "hM97yt4tJYQfW3s43efLSmYs1Nd2",
                    status_akun: "Alight Motion Pro VIP",
                    order_id_aktivasi: data.orderId || data.order_id || "neo-6edf4919dbb9",
                    masa_berlaku_vip: "25 September 2027",
                    token_type: data.tokenType || "Bearer",
                    raw: data
                }
            });
        }

        // Action tidak dikenal
        return res.status(404).json({ sukses: false, pesan: "Action tidak ditemukan" });

    } catch (error) {
        console.error("AMPrem error:", error);
        if (error.name === "TimeoutError" || error.name === "AbortError") {
            return res.status(504).json({ sukses: false, pesan: "Request timeout" });
        }
        return res.status(500).json({ sukses: false, pesan: "Gagal: " + error.message });
    }
}
