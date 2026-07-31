const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '8830862537';

// Authenticate token for college routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decoded:', decoded);
    
    // Handle different token structures
    if (decoded.college_code || decoded.collegeCode) {
      req.college = {
        college_code: decoded.college_code || decoded.collegeCode,
        email: decoded.email,
        name: decoded.name,
        id: decoded.college_id || decoded.id
      };
    } else if (decoded.college) {
      req.college = decoded.college;
    } else {
      req.college = {
        college_code: decoded.code || decoded.collegeCode,
        email: decoded.email,
        name: decoded.name,
        id: decoded.id
      };
    }
    
    // Store user info for admin routes
    if (decoded.role) {
      req.user = decoded;
    }
    
    console.log('✅ Auth data set:', req.college || req.user);
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Authenticate for admin routes
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken, authenticateAdmin };