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

        // ============================================
        // DETEKSI SAPAAN
        // ============================================
        const sapaan = [
            "halo", "hai", "hi", "hey", "hei", "hallo", "helo",
            "assalamualaikum", "salam", "pagi", "siang", "sore",
            "malam", "selamat pagi", "selamat siang", "selamat sore",
            "selamat malam", "permisi", "oy", "woi", "woy", "tes", "test",
            "p", "ping", "yo", "sup", "wassup", "apa kabar", "kabar"
        ];

        const promptLower = prompt.toLowerCase().trim();
        const isSapaan = sapaan.some(function(kata) {
            // Cocok persis atau cuma sapaan + tanda baca
            return promptLower === kata ||
                   promptLower === kata + "!" ||
                   promptLower === kata + "?" ||
                   promptLower === kata + " " ||
                   promptLower.startsWith(kata + " ");
        });

        if (isSapaan) {
            const balasanSapaan = [
                "Halo! Saya Ariel AI, siap membantu kamu. Ada yang bisa saya bantu?",
                "Hai! Ariel AI di sini. Mau tanya apa hari ini?",
                "Halo halo! Saya Ariel AI, asisten cerdas kamu. Silakan tanya apa saja!",
                "Hai! Ariel AI siap membantu. Ada yang bisa saya bantu?",
                "Halo! Kenalin, saya Ariel AI. Mau ngobrol apa kita hari ini?",
                "Hai hai! Ariel AI nih. Silakan tanya apa saja ya!"
            ];
            const pilih = balasanSapaan[Math.floor(Math.random() * balasanSapaan.length)];

            return res.json({
                success: true,
                creator: "Ariel AI",
                data: {
                    response: pilih,
                    text: prompt
                }
            });
        }

        // ============================================
        // PERTANYAAN BIASA → KE XYLOAPI
        // ============================================
        const promptFinal = "Kamu adalah Ariel AI, asisten cerdas yang ramah. Jawab dengan Bahasa Indonesia yang santai dan jelas. Pertanyaan: " + prompt;

        const apiUrl = "https://xyloapi.qzz.io/api/ai-chat/aya?prompt=" + encodeURIComponent(promptFinal);

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
