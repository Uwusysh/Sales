import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// In-memory store for reminders (in production, use a database)
const reminders = new Map();

/**
 * POST /api/reminders
 * Create a WhatsApp reminder for a lead
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { leadRowIndex, phoneNumber, message, scheduledTime } = req.body;
    const agentName = req.user.agentName;

    if (!leadRowIndex || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Lead row index and phone number are required'
      });
    }

    const reminderId = `${leadRowIndex}-${Date.now()}`;
    const reminder = {
      id: reminderId,
      leadRowIndex,
      phoneNumber,
      message: message || 'Follow-up reminder',
      scheduledTime: scheduledTime || new Date().toISOString(),
      agentName,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    reminders.set(reminderId, reminder);

    // In production, you would:
    // 1. Save to database
    // 2. Queue the message in a job scheduler
    // 3. Integrate with WhatsApp Business API

    console.log('📱 WhatsApp reminder scheduled:', reminder);

    res.json({
      success: true,
      message: 'WhatsApp reminder scheduled successfully',
      data: reminder
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reminders
 * Get all reminders for the logged-in agent
 */
router.get('/', authenticateToken, (req, res, next) => {
  try {
    const agentName = req.user.agentName;
    const agentReminders = [];

    reminders.forEach(reminder => {
      if (reminder.agentName === agentName) {
        agentReminders.push(reminder);
      }
    });

    res.json({
      success: true,
      count: agentReminders.length,
      data: agentReminders
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/reminders/:id
 * Cancel a reminder
 */
router.delete('/:id', authenticateToken, (req, res, next) => {
  try {
    const { id } = req.params;
    const reminder = reminders.get(id);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: 'Reminder not found'
      });
    }

    // Check if the reminder belongs to the logged-in agent
    if (reminder.agentName !== req.user.agentName) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this reminder'
      });
    }

    reminders.delete(id);

    res.json({
      success: true,
      message: 'Reminder cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

