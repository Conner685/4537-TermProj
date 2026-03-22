class AiController {
    constructor(db) {
        this.db = db;
    }

    handleAsk(req, res) {
        const userId = req.user.id;
        
        const { targetPhone, goal } = req.body; 

        const checkQuotaQuery = `SELECT api_calls_remaining FROM users WHERE id = ?`;
        
        this.db.query(checkQuotaQuery, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error checking quota' });
            
            if (results.length === 0) return res.status(404).json({ error: 'User not found' });

            let currentQuota = results[0].api_calls_remaining;

            if (currentQuota <= 0) {
                return res.status(403).json({ 
                    error: 'API limit reached. You have 0 calls remaining.',
                    api_calls_remaining: 0
                });
            }

            const newQuota = currentQuota - 1;
            const updateQuotaQuery = `UPDATE users SET api_calls_remaining = ? WHERE id = ?`;

            this.db.query(updateQuotaQuery, [newQuota, userId], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: 'Failed to update API quota' });


                //TODO CHANGE SOON
                const mockTranscript = `System initiated call to ${targetPhone || 'unknown number'}. Goal established: "${goal || 'General inquiry'}". AI agent successfully completed the interaction.`;

                res.status(200).json({
                    message: 'AI request processed successfully.',
                    transcript: mockTranscript,
                    api_calls_remaining: newQuota
                });
            });
        });
    }
}

module.exports = AiController;