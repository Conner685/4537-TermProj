class AdminController {
    constructor(db) {
        this.db = db;
    }

    getUsers(req, res) {
        const query = `SELECT id, email, role, api_calls_remaining FROM users ORDER BY id ASC`;
        
        this.db.query(query, (err, results) => {
            if (err) {
                console.error("Database error fetching users:", err);
                return res.status(500).json({ error: 'Database error fetching users' });
            }
            res.status(200).json(results);
        });
    }
}

module.exports = AdminController;