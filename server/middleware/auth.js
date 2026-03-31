const jwt = require('jsonwebtoken');

class AuthMiddleware {
    static verifyToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(403).json({ error: 'Access denied. No token provided.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = decoded; 
            
            next(); 
        } catch (err) {
            res.status(401).json({ error: 'Invalid or expired token.' });
        }
    }

    static verifyAdmin(req, res, next) {
        if (req.user && req.user.role === 'admin') {
            next(); 
        } else {
            res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
    }
}

module.exports = AuthMiddleware;