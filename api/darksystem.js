export const config = {
    maxDuration: 60
};

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });

    try {
        const { name } = req.query;
        if (!name) return res.status(400).json({ success: false, message: "Parameter name wajib diisi" });

        const apiUrl = "https://xyloapi.qzz.io/api/maker/darksystem?name=" + encodeURIComponent(name);
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json"
            },
            signal: AbortSignal.timeout(55000)
        });

        const data = await response.json();

        var imageUrl = '';
        if (data.data && data.data.image) imageUrl = data.data.image;
        else if (data.image) imageUrl = data.image;
        else if (data.result) imageUrl = data.result;
        else if (data.url) imageUrl = data.url;

        if (!imageUrl) {
            return res.status(500).json({ success: false, message: "Gambar tidak tersedia" });
        }

        return res.json({
            success: true,
            image: "/api/img?url=" + encodeURIComponent(imageUrl)
        });

    } catch (error) {
        if (error.name === "TimeoutError" || error.name === "AbortError") {
            return res.status(504).json({ success: false, message: "API timeout" });
        }
        return res.status(500).json({ success: false, message: "Gagal: " + error.message });
    }
}
