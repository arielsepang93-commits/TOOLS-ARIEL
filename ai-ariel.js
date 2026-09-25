export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const { prompt } = req.query;

        if (!prompt) {
            return res.status(400).json({ success: false, message: "Parameter prompt wajib diisi" });
        }

        const apiUrl = "https://xyloapi.qzz.io/api/ai-chat/aya?prompt=" + encodeURIComponent(prompt);

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json"
            },
            signal: AbortSignal.timeout(30000)
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        console.error("AI Ariel error:", error);
        if (error.name === "TimeoutError" || error.name === "AbortError") {
            return res.status(504).json({ success: false, message: "Request timeout" });
        }
        return res.status(500).json({ success: false, message: "Gagal: " + error.message });
    }
}
