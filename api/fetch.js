export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const url = req.query.url;

        if (!url) return res.status(400).json({ success: false, message: "Parameter url wajib diisi" });

        let target;
        try { target = new URL(url); }
        catch { return res.status(400).json({ success: false, message: "URL tidak valid" }); }

        if (!["http:", "https:"].includes(target.protocol)) {
            return res.status(400).json({ success: false, message: "Hanya HTTP dan HTTPS yang diperbolehkan" });
        }

        const response = await fetch(target.href, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "id-ID,id;q=0.9,en;q=0.8"
            },
            redirect: "follow"
        });

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: `Website mengembalikan status ${response.status}`
            });
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("text/html")) {
            return res.status(400).json({ success: false, message: "URL tersebut tidak mengembalikan halaman HTML" });
        }

        const html = await response.text();
        return res.json({ success: true, url: response.url, html: html });

    } catch (error) {
        console.error("Fetch error:", error);
        return res.status(500).json({ success: false, message: "Gagal mengambil halaman: " + error.message });
    }
}
