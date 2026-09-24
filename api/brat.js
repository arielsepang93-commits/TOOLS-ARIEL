export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const { text } = req.query;

        if (!text) {
            return res.status(400).json({ success: false, message: "Parameter text wajib diisi" });
        }

        if (text.length > 100) {
            return res.status(400).json({ success: false, message: "Teks maksimal 100 karakter" });
        }

        const apiUrl = "https://xyloapi.qzz.io/api/maker/brat?text=" + encodeURIComponent(text);

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/*, application/json, */*"
            },
            signal: AbortSignal.timeout(20000)
        });

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: "XyloAPI mengembalikan status " + response.status
            });
        }

        const contentType = response.headers.get("content-type") || "";

        // Kalau XyloAPI balikin gambar langsung
        if (contentType.startsWith("image/")) {
            const buffer = await response.arrayBuffer();
            res.setHeader("Content-Type", contentType);
            res.setHeader("Cache-Control", "public, max-age=3600");
            return res.status(200).send(Buffer.from(buffer));
        }

        // Kalau balikin JSON
        const data = await response.json();
        return res.json(data);

    } catch (error) {
        console.error("Brat error:", error);
        if (error.name === "TimeoutError" || error.name === "AbortError") {
            return res.status(504).json({ success: false, message: "Request timeout" });
        }
        return res.status(500).json({ success: false, message: "Gagal: " + error.message });
    }
}
