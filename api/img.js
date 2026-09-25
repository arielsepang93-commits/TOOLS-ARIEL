export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });

    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ success: false, message: "Parameter url wajib diisi" });

        const targetUrl = new URL(url);
        if (!['http:', 'https:'].includes(targetUrl.protocol)) {
            return res.status(400).json({ success: false, message: "URL tidak valid" });
        }

        const response = await fetch(targetUrl.toString(), {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/*,*/*",
                "Referer": "https://xyloapi.qzz.io/"
            },
            signal: AbortSignal.timeout(20000)
        });

        if (!response.ok) {
            return res.status(response.status).json({ success: false, message: "Gagal ambil gambar" });
        }

        const contentType = response.headers.get("content-type") || "image/png";
        const buffer = await response.arrayBuffer();

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.status(200).send(Buffer.from(buffer));

    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal: " + error.message });
    }
}
