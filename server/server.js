const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const DatabaseConfig = require('./config_modules/configs.js');
const AuthController = require('./controllers/AuthController.js');
const AuthMiddleware = require('./middleware/auth.js');
const AiController = require('./controllers/AiController.js');

class Server {
    constructor() {
        this.app = express();
        this.PORT = process.env.PORT || 8888;
        
        this.db = this.initializeDatabase();
        
        this.authController = new AuthController(this.db);
        this.aiController = new AiController(this.db);
        
        this.configureMiddleware();
        this.configureRoutes();
    }

    initializeDatabase() {
        const dbConfig = new DatabaseConfig('write').getConfig();
        const db = mysql.createConnection(dbConfig);
        
        db.connect((err) => {
            if (err) console.error("Database connection failed: ", err.message);
            else console.log("Connected to database");
        });
        
        return db;
    }

    configureMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    configureRoutes() {
        this.app.get('/', (req, res) => {
            res.status(200).send(`
                <div style="font-family: sans-serif; padding: 40px; text-align: center;">
                    <h1 style="color: #667eea;">AI Telephony API Server is Online</h1>
                    <p>All microservices are running. Send API requests to the <strong>/api</strong> endpoints.</p>
                </div>
            `);
        });

        this.app.post('/api/register', (req, res) => this.authController.register(req, res));
        this.app.post('/api/login', (req, res) => this.authController.login(req, res));

        this.app.post('/api/ai/ask', AuthMiddleware.verifyToken, (req, res) => this.aiController.handleAsk(req, res));
    }

    start() {
        this.app.listen(this.PORT, () => {
            console.log(`Server running on port ${this.PORT}`);
        });
    }
}

const server = new Server();
server.start();