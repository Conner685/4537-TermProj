class AiController {
    constructor(db) {
        this.db = db;
    }

    async handleAsk(req, res) {
        const userId = req.user.id;
        const { targetPhone, goal } = req.body; 

        const checkQuotaQuery = `SELECT api_calls_remaining FROM users WHERE id = ?`;
        
        this.db.query(checkQuotaQuery, [userId], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error checking quota' });
            if (results.length === 0) return res.status(404).json({ error: 'User not found' });

            let currentQuota = results[0].api_calls_remaining;

            if (currentQuota <= 0) {
                return res.status(403).json({ 
                    error: 'API limit reached. You have 0 calls remaining.',
                    api_calls_remaining: 0
                });
            }

            try {
                const hfUrl = `https://router.huggingface.co/v1/chat/completions`;
                
                const HF_MODEL = 'Qwen/Qwen2.5-7B-Instruct'; 

                const hfResponse = await fetch(hfUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.HF_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: HF_MODEL,
                        messages: [
                            { 
                                role: "system", 
                                content: "You are a professional virtual phone assistant. Keep responses under 2 sentences." 
                            },
                            { 
                                role: "user", 
                                content: `Please start a phone conversation with ${targetPhone || 'a user'}. Your goal is: ${goal || 'To ask how their day is going.'}` 
                            }
                        ],
                        max_tokens: 75, 
                        temperature: 0.7 
                    })
                });

                if (!hfResponse.ok) {
                    const errorText = await hfResponse.text();
                    throw new Error(`API rejected request: ${hfResponse.status} - ${errorText}`);
                }

                const hfData = await hfResponse.json();

                const generatedText = hfData.choices[0].message.content.trim();

                const transcript = `Call established with ${targetPhone || 'unknown number'}.\n\nAI Agent says:\n"${generatedText}"`;

                const newQuota = currentQuota - 1;
                const updateQuotaQuery = `UPDATE users SET api_calls_remaining = ? WHERE id = ?`;

                this.db.query(updateQuotaQuery, [newQuota, userId], (updateErr) => {
                    if (updateErr) return res.status(500).json({ error: 'Failed to update API quota' });

                    res.status(200).json({
                        message: 'AI request processed successfully.',
                        transcript: transcript,
                        api_calls_remaining: newQuota
                    });
                });

            } catch (error) {
                console.error("Hugging Face API Error:", error.message);
                res.status(500).json({ error: 'AI processing failed. Your quota was not charged.' });
            }
        });
    }
}

module.exports = AiController;