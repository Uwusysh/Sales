import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    req.user = user;
    next();
  });
};

export const generateToken = (user) => {
  return jwt.sign(
    { 
      username: user.username, 
      agentName: user.agentName,
      role: user.role || 'agent'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

