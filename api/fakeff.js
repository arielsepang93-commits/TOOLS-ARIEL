export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ success: false, message: "Parameter username wajib diisi" });
        }

        const apiUrl = "https://xyloapi.qzz.io/api/maker/fakeff?username=" + encodeURIComponent(username);

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/*, application/json, text/html, */*"
            },
            signal: AbortSignal.timeout(20000)
        });

        const contentType = response.headers.get("content-type") || "";

        if (contentType.startsWith("image/")) {
            const buffer = await response.arrayBuffer();
            res.setHeader("Content-Type", contentType);
            return res.status(200).send(Buffer.from(buffer));
        }

        const text_response = await response.text();

        try {
            const parsed = JSON.parse(text_response);
            return res.status(response.status).json(parsed);
        } catch (e) {
            return res.status(response.status).json({
                success: false,
                message: "Response bukan JSON valid",
                raw: text_response
            });
        }

    } catch (error) {
        console.error("Fake FF error:", error);
        if (error.name === "TimeoutError" || error.name === "AbortError") {
            return res.status(504).json({ success: false, message: "Request timeout" });
        }
        return res.status(500).json({ success: false, message: "Gagal: " + error.message });
    }
}
