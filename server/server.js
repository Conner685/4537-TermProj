// Dependencies
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const mysql = require('mysql2');
const DatabaseConfig = require('./config_modules/configs.js');

const writeConfig = new DatabaseConfig('write').getConfig();
const readConfig = new DatabaseConfig('read').getConfig();

const app = express()
const PORT = process.env.PORT || 8888;

/**
 * Server class to handle HTTP requests and database operations
 */
class Server {
    constructor(port = 8888) {
        this.PORT = port;
        this.CORS_HEADERS = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };
        
        this.QUERIES = {
            CREATE_TABLE: `CREATE TABLE IF NOT EXISTS patient (
                patientid INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                dateOfBirth DATETIME
            ) ENGINE=InnoDB`,
            INSERT_DATA: `INSERT INTO patient (name, dateOfBirth) VALUES
                ('Sara Brown', '1901-01-01'),
                ('John Smith', '1941-01-01'),
                ('Jack Ma', '1961-01-30'),
                ('Elon Musk', '1999-01-01')`,
        };
        
        // Initialize database connections
        this.writeToDB = mysql.createConnection(writeConfig);
        this.readFromDB = mysql.createConnection(readConfig);
    }
    
    /**
     * Set CORS headers on response
     */
    setCorsHeaders(res) {
        Object.entries(this.CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
    }
    
    /**
     * Send JSON response with status code
     */
    sendJsonResponse(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }
    
    /**
     * Handle POST /insert - Create table and insert sample data
     */
    handleInsertRequest(req, res) {
        this.writeToDB.query(this.QUERIES.CREATE_TABLE, (err) => {
            if (err) {
                return this.sendJsonResponse(res, 500, { error: `DB Error: ${err.message}` });
            }

            this.writeToDB.query(this.QUERIES.INSERT_DATA, (err, result) => {
                if (err) {
                    return this.sendJsonResponse(res, 500, { error: `Insert Error: ${err.message}` });
                }

                this.sendJsonResponse(res, 200, {
                    message: 'Data inserted',
                    affectedRows: result.affectedRows,
                });
            });
        });
    }
    
    /**
     * Handle GET /api/v1/sql/ - Execute read-only query
     */
    handleQueryRequest(req, res, reqUrl) {
        const userQuery = reqUrl.query.q;

        if (!userQuery) {
            return this.sendJsonResponse(res, 400, { error: 'Missing SQL query parameter' });
        }

        const cleanQuery = userQuery.replace(/^"|"$/g, '');
        console.log('Executing Read-Only Query:', cleanQuery);

        this.readFromDB.query(cleanQuery, (err, results) => {
            if (err) {
                return this.sendJsonResponse(res, 400, { error: `Query Failed: ${err.message}` });
            }

            this.sendJsonResponse(res, 200, results);
        });
    }
    
    /**
     * Handle 404 Not Found
     */
    handleNotFound(res) {
        this.sendJsonResponse(res, 404, { error: 'Endpoint not found' });
    }
    
    /**
     * Start the server
     */
    start() {
        const server = http.createServer((req, res) => {
            const reqUrl = url.parse(req.url, true);

            // Set CORS headers
            this.setCorsHeaders(res);

            // Handle preflight OPTIONS request
            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            // Route handlers
            if (req.method === 'POST' && reqUrl.pathname === '/insert') {
                this.handleInsertRequest(req, res);
            } else if (req.method === 'GET' && reqUrl.pathname === '/api/v1/sql/') {
                this.handleQueryRequest(req, res, reqUrl);
            } else {
                this.handleNotFound(res);
            }
        });

        server.listen(this.PORT, () => {
            console.log(`Server running on port ${this.PORT}`);
        });
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});