import express from 'express';
import User from '../models/User.js';
import Video from '../models/Video.js';
import { requireAuth } from '../middleware/auth.js';
import { getAuth } from '@clerk/express';

const router = express.Router();

// Synchronize User from Auth provider to MongoDB Compass
router.post('/', async (req, res) => {
  try {
    const { clerkId, email, fullName, avatarUrl } = req.body;

    if (!clerkId || !email || !fullName) {
      return res.status(400).json({ error: 'clerkId, email, and fullName are required' });
    }

    // Check if user already exists by clerkId
    let user = await User.findOne({ clerkId });
    if (user) {
      return res.status(200).json({ message: 'User already synchronized', user });
    }

    // Check if user already exists with this email address
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      // Update existing user with new clerkId and details
      user.clerkId = clerkId;
      if (fullName) user.fullName = fullName.trim();
      if (avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
      console.log(`Associated existing user email (${email}) with new clerkId via POST /users: ${clerkId}`);
      return res.status(200).json({ message: 'User synchronized successfully', user });
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
    const { fullName, avatarUrl, channelName } = req.body;

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
      // Sync creator avatar on all uploaded videos
      await Video.updateMany(
        { creatorId: user._id },
        { 'creator.avatarUrl': avatarUrl }
      );
      // Sync avatar in all comment subdocuments
      await Video.updateMany(
        { "comments.userId": user._id },
        { $set: { "comments.$[elem].avatarUrl": avatarUrl } },
        { arrayFilters: [{ "elem.userId": user._id }] }
      );
    }

    if (channelName !== undefined && user.isCreator) {
      const trimmedChannel = channelName.trim();
      if (trimmedChannel.length === 0) {
        return res.status(400).json({ error: 'Channel name cannot be empty' });
      }
      if (trimmedChannel.length > 50) {
        return res.status(400).json({ error: 'Channel name cannot exceed 50 characters' });
      }

      const existingChannel = await User.findOne({ 
        channelName: { $regex: new RegExp(`^${trimmedChannel}$`, 'i') }, 
        _id: { $ne: user._id } 
      });
      if (existingChannel) {
        return res.status(400).json({ error: 'Channel name is already taken' });
      }

      user.channelName = trimmedChannel;
      
      // Sync creator name on all uploaded videos
      await Video.updateMany(
        { creatorId: user._id },
        { 'creator.name': trimmedChannel }
      );
    }

    // Sync comments author name with updated fullName
    await Video.updateMany(
      { "comments.userId": user._id },
      { $set: { "comments.$[elem].author": user.fullName } },
      { arrayFilters: [{ "elem.userId": user._id }] }
    );

    await user.save();
    console.log(`Updated user profile and synced content: ${user.fullName}`);
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error updating user profile' });
  }
});

// Become a Creator
router.post('/profile/become-creator', requireAuth, async (req, res) => {
  try {
    const { channelName, channelDescription } = req.body;
    if (!channelName) {
      return res.status(400).json({ error: 'Channel Name is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isCreator = true;
    user.channelName = channelName.trim();
    user.channelDescription = (channelDescription || '').trim();
    
    user.notifications.push({
      message: `Congratulations! Your channel "${user.channelName}" is now active. Start uploading now!`
    });

    await user.save();
    console.log(`User upgraded to creator: ${user.fullName} (${user.channelName})`);
    res.status(200).json({ message: 'Upgraded to Creator successfully', user });
  } catch (error) {
    console.error('Error becoming creator:', error);
    res.status(500).json({ error: 'Server error upgrading profile to creator' });
  }
});

// Subscribe / Unsubscribe to Creator
router.post('/:id/subscribe', requireAuth, async (req, res) => {
  try {
    const creatorId = req.params.id;
    if (creatorId === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot subscribe to your own channel' });
    }

    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const user = await User.findById(req.user._id);

    const subIdx = user.subscriptions.indexOf(creatorId);
    let isSubscribed = false;

    if (subIdx > -1) {
      user.subscriptions.splice(subIdx, 1);
      
      const creatorIdx = creator.subscribers.indexOf(user._id);
      if (creatorIdx > -1) {
        creator.subscribers.splice(creatorIdx, 1);
      }
      isSubscribed = false;
    } else {
      user.subscriptions.push(creatorId);
      creator.subscribers.push(user._id);
      isSubscribed = true;

      creator.notifications.push({
        message: `${user.fullName} subscribed to your channel!`
      });
      await creator.save();
    }

    await user.save();
    res.status(200).json({
      message: isSubscribed ? 'Subscribed successfully' : 'Unsubscribed successfully',
      isSubscribed,
      subscribersCount: creator.subscribers.length
    });
  } catch (error) {
    console.error('Error toggling subscription:', error);
    res.status(500).json({ error: 'Server error toggling subscription' });
  }
});

// Fetch Creator Public Profile
router.get('/creator/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const creator = await User.findById(id);
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const videos = await Video.find({ creatorId: id }).sort({ createdAt: -1 });

    let isSubscribed = false;
    try {
      const { userId } = getAuth(req);
      if (userId) {
        const currentUser = await User.findOne({ clerkId: userId });
        if (currentUser) {
          isSubscribed = currentUser.subscriptions.includes(id);
        }
      }
    } catch (authErr) {
      // Ignore auth errors for public routes
    }

    res.status(200).json({
      creator: {
        _id: creator._id,
        fullName: creator.fullName,
        avatarUrl: creator.avatarUrl,
        channelName: creator.channelName,
        channelDescription: creator.channelDescription,
        subscribersCount: creator.subscribers.length,
      },
      videos,
      isSubscribed
    });
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    res.status(500).json({ error: 'Server error fetching creator profile' });
  }
});

export default router;
