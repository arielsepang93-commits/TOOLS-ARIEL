export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const { url, server } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, message: "Parameter url wajib diisi" });
        }

        const pattern = /tiktok\.com|vm\.tiktok|vt\.tiktok/i;
        if (!pattern.test(url)) {
            return res.status(400).json({ success: false, message: "Link bukan dari TikTok" });
        }

        const serverPilihan = server || "server1";
        const apiUrl = "https://xyloapi.qzz.io/api/downloader/tiktok?url=" + encodeURIComponent(url) + "&server=" + encodeURIComponent(serverPilihan);

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*"
            },
            signal: AbortSignal.timeout(20000)
        });

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: "XyloAPI mengembalikan status " + response.status
            });
        }

        const data = await response.json();
        return res.json(data);

    } catch (error) {
        console.error("TikTok downloader error:", error);
        if (error.name === "TimeoutError" || error.name === "AbortError") {
            return res.status(504).json({ success: false, message: "Request timeout" });
        }
        return res.status(500).json({ success: false, message: "Gagal ambil data: " + error.message });
    }
}
