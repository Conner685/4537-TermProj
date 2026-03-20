const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const DatabaseConfig = require('./config_modules/configs.js');
const AuthController = require('./controllers/AuthController.js');
const AuthMiddleware = require('./middleware/auth.js');

class Server {
    constructor() {
        this.app = express();
        this.PORT = process.env.PORT || 8888;
        
        this.db = this.initializeDatabase();
        
        this.authController = new AuthController(this.db);
        
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
        this.app.post('/api/register', (req, res) => this.authController.register(req, res));
        this.app.post('/api/login', (req, res) => this.authController.login(req, res));

        this.app.post('/api/ai/ask', AuthMiddleware.verifyToken, (req, res) => {
            res.status(200).json({ 
                message: `Welcome ${req.user.email}!` 
            });
        });
    }

    start() {
        this.app.listen(this.PORT, () => {
            console.log(`Server running on port ${this.PORT}`);
        });
    }
}

const server = new Server();
server.start();