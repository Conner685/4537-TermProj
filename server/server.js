// Dependencies
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const mysql = require('mysql2');
const DatabaseConfig = require('./config_modules/configs.js');

const dbConfig = new DatabaseConfig('write').getConfig();
const db = mysql.createConnection(dbConfig);

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8888;
const JWT_SECRET = process.env.JWT_SECRET;

db.connect((err) => {
    if (err) console.error("Database connection failed: ", err.message);
    else console.log("Connected to database")
});

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({error: 'Email and password required'});
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertQuery = `INSERT INTO users (email, password_hash) VALUES (?, ?)`;

        db.query(insertQuery, [email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Email already registered' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const selectQuery = `SELECT * FROM users WHERE email = ?`;

    db.query(selectQuery, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const payload = { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ 
            message: 'Login successful', 
            token: token,
            role: user.role,
            api_calls_remaining: user.api_calls_remaining 
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});