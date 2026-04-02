class AiController {
    constructor(db) {
        this.db = db;
    }

    async handleAsk(req, res) {
        const userId = req.user.id;
        const { targetPhone, goal } = req.body; 

        if (!targetPhone.startsWith('+')) {
            return res.status(400).json({ error: 'Phone number must include country code (e.g., +16045550199)' });
        }

        const checkQuotaQuery = `SELECT api_calls_remaining FROM users WHERE id = ?`;
        
        this.db.query(checkQuotaQuery, [userId], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error checking quota' });
            if (results.length === 0) return res.status(404).json({ error: 'User not found' });

            let currentQuota = results[0].api_calls_remaining;

            if (currentQuota <= 0) {
                return res.status(403).json({ error: 'API limit reached.', api_calls_remaining: 0 });
            }

            try {
                const response = await fetch('https://api.bland.ai/v1/calls', {
                    method: 'POST',
                    headers: {
                        'authorization': process.env.BLAND_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        phone_number: targetPhone,
                        task: `You are a professional virtual phone assistant. Your goal is: ${goal}`,
                        voice: "nat", 

                        webhook: "https://four537-termproj-server.onrender.com/api/webhook/call-complete"
                    })
                });

                const data = await response.json();

                if (data.status !== "success") {
                    throw new Error(data.message || 'Telephony API rejected the call.');
                }

                const newQuota = currentQuota - 1;
                const updateQuotaQuery = `UPDATE users SET api_calls_remaining = ? WHERE id = ?`;

                this.db.query(updateQuotaQuery, [newQuota, userId], (updateErr) => {
                    if (updateErr) return res.status(500).json({ error: 'Failed to update API quota' });

                    res.status(200).json({
                        message: 'Phone call dispatched successfully! The AI is calling now.',
                        transcript: `Call ID: ${data.call_id}\n\nThe AI is currently calling ${targetPhone}. Awaiting completion...`,
                        api_calls_remaining: newQuota
                    });
                });

            } catch (error) {
                console.error("Telephony API Error:", error.message);
                res.status(500).json({ error: 'Failed to initiate phone call. Quota not charged.' });
            }
        });
    }

    async handleWebhook(req, res) {
        const callData = req.body;
        
        console.log("========== CALL COMPLETED ==========");
        console.log("Call ID:", callData.call_id);
        console.log("Call Length:", callData.call_length, "minutes");
        console.log("Summary:", callData.summary);
        console.log("Full Transcript:", callData.concatenated_transcript);
        console.log("====================================");


        res.status(200).send('Webhook received');
    }
}

module.exports = AiController;