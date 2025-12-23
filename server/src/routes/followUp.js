import express from 'express';
import sheetsService from '../services/sheetsService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/follow-up/update
 * Body:
 *   - rowIndex: Row number in sheet
 *   - followUpDate: New date (YYYY-MM-DD)
 *   - followUpTime: New time (HH:MM)
 *   - followUpMode: Call or WhatsApp
 */
router.post('/update', authenticateToken, async (req, res, next) => {
  try {
    const { rowIndex, followUpDate, followUpTime, followUpMode } = req.body;

    if (!rowIndex) {
      return res.status(400).json({
        success: false,
        error: 'rowIndex is required'
      });
    }

    const updates = {};
    if (followUpDate !== undefined) updates.followUpDate = followUpDate;
    if (followUpTime !== undefined) updates.followUpTime = followUpTime;
    if (followUpMode !== undefined) updates.followUpMode = followUpMode;

    const result = await sheetsService.updateFollowUp(rowIndex, updates);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/follow-up/complete
 * Body:
 *   - rowIndex: Row number in sheet
 *   - completed: true/false
 */
router.post('/complete', authenticateToken, async (req, res, next) => {
  try {
    const { rowIndex, completed = true } = req.body;

    if (!rowIndex) {
      return res.status(400).json({
        success: false,
        error: 'rowIndex is required'
      });
    }

    const result = await sheetsService.completeFollowUp(rowIndex, completed);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

export default router;

