class DatabaseConfig {
    constructor(type = 'write') {
        this.type = type;
        this.host = process.env.DB_HOST;
        this.port = process.env.DB_PORT;
        this.database = process.env.DB_NAME;
        const caCert = process.env.DB_SSL_CERT || null;
        this.ssl = caCert ? { ca: caCert } : false;
        
        if (type === 'write') {
            this.user = process.env.DB_USER;
            this.password = process.env.DB_PASSWORD;
        } else if (type === 'read') {
            this.user = process.env.DB_READ_USER;
            this.password = process.env.DB_READ_PASSWORD;
        }
    }

    getConfig() {
        return {
            host: this.host,
            port: this.port,
            user: this.user,
            password: this.password,
            database: this.database,
            ssl: this.ssl
        };
    }
}

module.exports = DatabaseConfig;
