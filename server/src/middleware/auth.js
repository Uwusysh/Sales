import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '24h';

/**
 * Centralized JWT verification middleware
 * - Reads Authorization: Bearer <token>
 * - Verifies using JWT_SECRET
 * - Attaches decoded user to req.user
 * - Returns 401 for missing token, 403 for invalid/expired token
 */
export const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // No token provided - 401 Unauthorized
  if (!token) {
    console.log('🔒 Auth failed: No token provided for', req.method, req.path);
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  // Verify token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // Determine error type for better client handling
      let errorCode = 'TOKEN_INVALID';
      let errorMessage = 'Invalid token';
      
      if (err.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        errorMessage = 'Token has expired';
        console.log('🔒 Auth failed: Token expired for', req.method, req.path);
      } else if (err.name === 'JsonWebTokenError') {
        errorCode = 'TOKEN_MALFORMED';
        errorMessage = 'Malformed token';
        console.log('🔒 Auth failed: Malformed token for', req.method, req.path);
      } else {
        console.log('🔒 Auth failed:', err.message, 'for', req.method, req.path);
      }

      return res.status(403).json({ 
        success: false, 
        error: errorMessage,
        code: errorCode
      });
    }

    // Token is valid - attach user to request
    req.user = {
      username: decoded.username,
      agentName: decoded.agentName,
      role: decoded.role || 'agent'
    };
    
    next();
  });
};

/**
 * Generate JWT token for authenticated user
 */
export const generateToken = (user) => {
  return jwt.sign(
    { 
      username: user.username, 
      agentName: user.agentName,
      role: user.role || 'agent'
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

/**
 * Optional: Admin-only middleware (use after authenticateToken)
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    console.log(`🚫 Admin access denied for user: ${req.user.username}`);
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

export default { authenticateToken, generateToken, requireAdmin };
