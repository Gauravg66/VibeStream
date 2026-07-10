import { getAuth, clerkClient } from '@clerk/express';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authorization token required or invalid' });
    }

    // Load the user from MongoDB database
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      try {
        // Auto-sync User from Clerk if not already synchronized in MongoDB
        const clerkUser = await clerkClient.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email;
        const avatarUrl = clerkUser.imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`;

        // Check if user already exists with this email address
        if (email) {
          user = await User.findOne({ email: email.toLowerCase() });
        }

        if (user) {
          // Associate the existing user with the new clerkId
          user.clerkId = userId;
          await user.save();
          console.log(`Associated existing user email (${email}) with new clerkId: ${userId}`);
        } else {
          user = new User({
            clerkId: userId,
            email,
            fullName,
            avatarUrl,
            watchLater: [],
            notifications: [
              { message: `Welcome to VibeStream, ${fullName}! Explore our premium library now.` }
            ]
          });
          await user.save();
          console.log(`Auto-synchronized new user from Clerk to MongoDB: ${fullName} (${email})`);
        }
      } catch (syncErr) {
        console.error('Failed to auto-sync user from Clerk to MongoDB:', syncErr);
        return res.status(401).json({ error: 'User account not synchronized in MongoDB' });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Internal server authentication error' });
  }
};
