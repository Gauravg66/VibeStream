import express from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET notifications for authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ notifications: user.notifications || [] });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

// POST mark all notifications as read
router.post('/read', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.notifications.forEach(notification => {
      notification.isRead = true;
    });
    await user.save();
    res.status(200).json({ message: 'All notifications marked as read', notifications: user.notifications });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Server error updating notifications status' });
  }
});

export default router;
