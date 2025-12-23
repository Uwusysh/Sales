import express from 'express';
import userService from '../services/userService.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Login attempt for:', username);

    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const user = await userService.authenticate(username, password);

    if (!user) {
      console.log('❌ Authentication failed for:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const token = generateToken(user);
    console.log('✅ Login successful for:', username);

    res.json({
      success: true,
      data: {
        token,
        user
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUsername(req.user.username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/agents
 * Get all agents (for admin purposes)
 */
router.get('/agents', authenticateToken, (req, res, next) => {
  try {
    const agents = userService.getAllAgents();
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    next(error);
  }
});

export default router;

