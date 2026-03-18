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
    //TODO
});

app.post('/api/login', (req, res) => {
    //TODO
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});