const db = require('../db');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    
    if (!authHeader) {
      return res.status(401).json({ status: 'error', message: 'No token provided' });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Invalid token format' });
    }

    const [rows] = await db.execute(
      'SELECT id, email FROM users WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Authentication error', error: error.message });
  }
};

module.exports = authMiddleware;

