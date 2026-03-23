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
                const HF_MODEL = 'HuggingFaceH4/zephyr-7b-beta';
                const hfUrl = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
                
                const prompt = `<|system|>You are a professional, helpful virtual phone assistant.<|user|>Please start a phone conversation with a user. Your goal is: ${goal || 'To ask how their day is going.'}<|assistant|>`;

                const hfResponse = await fetch(hfUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.HF_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: { 
                            max_new_tokens: 50, 
                            return_full_text: false, 
                            temperature: 0.7 
                        }
                    })
                });

                const hfData = await hfResponse.json();

                if (hfData.error && hfData.estimated_time) {
                    return res.status(503).json({ 
                        error: `The AI model is currently waking up. Please try again in ${Math.ceil(hfData.estimated_time)} seconds.` 
                    });
                }

                if (!hfResponse.ok) {
                    throw new Error(hfData.error || 'Failed to fetch from Hugging Face');
                }

                const generatedText = hfData[0].generated_text.trim();

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