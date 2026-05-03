const jwt = require('jsonwebtoken');
module.exports = function (req, res, next) {
    // Get token from header or query param
    let token = req.header('Authorization');
    
    // Support token in query string for direct file downloads
    if (!token && req.query.token) {
        token = `Bearer ${req.query.token}`;
    }

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const parts = token.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ msg: 'Token format is invalid. Use Bearer <token>' });
    }

    const token1 = parts[1];
    // Verify token
    try {
        const decoded = jwt.verify(token1, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};  