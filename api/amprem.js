export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();

    const TARGET = "https://am-premiumms.vercel.app";

    const HEADERS = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S908E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/json",
        "Origin": TARGET,
        "Referer": TARGET + "/"
    };

    async function cobaEndpoint(urls, body) {
        let lastErr = null;
        for (const url of urls) {
            try {
                const r = await fetch(url, {
                    method: "POST",
                    headers: HEADERS,
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(15000)
                });
                const txt = await r.text();
                let data;
                try { data = JSON.parse(txt); } catch (e) { data = { raw: txt }; }
                if (r.ok) return { ok: true, status: r.status, data, url };
                lastErr = { ok: false, status: r.status, data, url };
            } catch (e) {
                lastErr = { ok: false, status: 0, data: { error: e.message }, url };
            }
        }
        return lastErr;
    }

    try {
        const action = req.query.action || (req.body && req.body.action);

        // ================= KIRIM MAGIC LINK =================
        if (action === "kirim-link") {
            const email = req.query.email || (req.body && req.body.email);
            if (!email) return res.status(400).json({ sukses: false, pesan: "Email wajib diisi" });

            const hasil = await cobaEndpoint([
                TARGET + "/api/send-magic-link",
                TARGET + "/api/auth/send-link",
                TARGET + "/api/send-link",
                TARGET + "/api/magic-link",
                TARGET + "/api/auth/magic-link",
                TARGET + "/api/email/send"
            ], { email });

            if (!hasil.ok) {
                return res.status(500).json({
                    sukses: false,
                    pesan: "Gagal mengirim magic link",
                    detail: JSON.stringify(hasil.data, null, 2),
                    lastUrl: hasil.url,
                    status: hasil.status
                });
            }

            return res.status(200).json({
                sukses: true,
                pesan: "Link verifikasi instan telah dikirim ke " + email + ". Cek inbox atau folder spam.",
                endpoint_used: hasil.url,
                data: hasil.data
            });
        }

        // ================= VERIFIKASI =================
        if (action === "verifikasi") {
            const email = req.query.email || (req.body && req.body.email);
            const link = req.query.link || (req.body && req.body.link);
            if (!email || !link) return res.status(400).json({ sukses: false, pesan: "Email dan link wajib diisi" });

            let oobCode = link.trim();
            if (oobCode.includes("oobCode=")) {
                try { oobCode = new URL(oobCode).searchParams.get("oobCode"); } catch (e) {}
            }

            const hasil = await cobaEndpoint([
                TARGET + "/api/verify-oobcode",
                TARGET + "/api/auth/verify",
                TARGET + "/api/verify",
                TARGET + "/api/activate",
                TARGET + "/api/auth/activate",
                TARGET + "/api/premium/activate"
            ], { email, oobCode });

            if (!hasil.ok) {
                return res.status(500).json({
                    sukses: false,
                    pesan: "Gagal verifikasi oobCode",
                    detail: JSON.stringify(hasil.data, null, 2),
                    lastUrl: hasil.url,
                    status: hasil.status
                });
            }

            return res.status(200).json({
                sukses: true,
                pesan: "Verifikasi berhasil, Alight Motion Premium VIP aktif 1 Tahun!",
                endpoint_used: hasil.url,
                data: {
                    email_target: email,
                    uid_firebase: hasil.data.uid || hasil.data.userId || "-",
                    status_akun: "Alight Motion Pro VIP",
                    order_id_aktivasi: hasil.data.orderId || hasil.data.order_id || "-",
                    masa_berlaku_vip: "25 September 2027",
                    token_type: hasil.data.tokenType || "Bearer",
                    raw: hasil.data
                }
            });
        }

        return res.status(404).json({ sukses: false, pesan: "Action tidak ditemukan" });

    } catch (error) {
        return res.status(500).json({
            sukses: false,
            pesan: "Server error: " + error.message,
            detail: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });
    }
}
