import express from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Synchronize User from Auth provider to MongoDB Compass
router.post('/', async (req, res) => {
  try {
    const { clerkId, email, fullName, avatarUrl } = req.body;

    if (!clerkId || !email || !fullName) {
      return res.status(400).json({ error: 'clerkId, email, and fullName are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ clerkId });
    if (user) {
      return res.status(200).json({ message: 'User already synchronized', user });
    }

    // Assign default avatar if not provided
    const userAvatar = avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`;

    user = new User({
      clerkId,
      email,
      fullName,
      avatarUrl: userAvatar,
      watchLater: [],
      notifications: [
        { message: `Welcome to VibeStream, ${fullName}! Explore our premium library now.` }
      ]
    });

    await user.save();
    console.log(`Synchronized new user to MongoDB: ${fullName} (${email})`);
    res.status(201).json({ message: 'User synchronized successfully', user });
  } catch (error) {
    console.error('Error synchronizing user:', error);
    res.status(500).json({ error: 'Server error during user synchronization' });
  }
});

// Fetch Current User Profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

// Update User Profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, avatarUrl } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: 'Full Name cannot be empty' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.fullName = fullName.trim();
    if (avatarUrl) {
      user.avatarUrl = avatarUrl;
    }

    await user.save();
    console.log(`Updated user profile: ${user.fullName}`);
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error updating user profile' });
  }
});

export default router;
