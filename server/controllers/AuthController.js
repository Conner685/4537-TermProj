const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
    constructor(db) {
        this.db = db;
    }
  
    async register(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const insertQuery = `INSERT INTO users (email, password_hash) VALUES (?, ?)`;

            this.db.query(insertQuery, [email, hashedPassword], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Email already registered' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'User registered successfully' });
            });
        } catch (error) {
          res.status(500).json({});
        }
    }
    
    login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const selectQuery = `SELECT * FROM users WHERE email = ?`;

        this.db.query(selectQuery, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = results[0];
            const match = await bcrypt.compare(password, user.password_hash);
            
            if (!match) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const payload = { id: user.id, email: user.email, role: user.role };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

            res.status(200).json({ 
                message: 'Login successful', 
                token: token,
                role: user.role,
                api_calls_remaining: user.api_calls_remaining 
            });
        });
    }
}

module.exports = AuthController;