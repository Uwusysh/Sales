import express from 'express';
import sheetsService from '../services/sheetsService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/leads
 * Get leads for the logged-in agent
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    // Get agent name from authenticated user
    const agentName = req.user.agentName;
    const leads = await sheetsService.getLeads(agentName);
    
    res.json({
      success: true,
      count: leads.length,
      data: leads,
      agent: agentName
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leads/new
 * Get new leads (for real-time dashboard)
 * Query params:
 *   - since: ISO timestamp to get leads added after this time
 */
router.get('/new', authenticateToken, async (req, res, next) => {
  try {
    const agentName = req.user.agentName;
    const { since } = req.query;
    
    const allLeads = await sheetsService.getLeads(agentName);
    
    // Filter for new leads if timestamp provided
    let newLeads = allLeads;
    if (since) {
      const sinceDate = new Date(since);
      newLeads = allLeads.filter(lead => {
        if (lead.lastUpdated) {
          return new Date(lead.lastUpdated) > sinceDate;
        }
        return false;
      });
    }
    
    res.json({
      success: true,
      count: newLeads.length,
      data: newLeads,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;

