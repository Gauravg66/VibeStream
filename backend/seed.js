import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Video from './models/Video.js';
import User from './models/User.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/videostream';

const deleteLocalFile = (fileUrl) => {
  if (!fileUrl) return;
  // If it's a local upload
  if (fileUrl.includes('/uploads/')) {
    const parts = fileUrl.split('/uploads/');
    const filename = parts[parts.length - 1];
    const filePath = path.join('uploads', filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[Disk Cleanup] Deleted local file: ${filePath}`);
      } catch (err) {
        console.error(`[Disk Cleanup] Failed to delete local file ${filePath}:`, err);
      }
    }
  }
};

async function cleanup() {
  try {
    console.log("Connecting to database:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected successfully!");

    // 1. Identify Mock Targets
    console.log("Identifying mock creators...");
    const mockUsers = await User.find({ clerkId: /^clerk_mock_/ });
    const mockUserIds = mockUsers.map(u => u._id);
    console.log(`Found ${mockUsers.length} mock creator(s) to remove.`);

    console.log("Identifying mock/demo videos...");
    const mockVideos = await Video.find({
      $or: [
        { creatorId: { $in: mockUserIds } },
        { videoUrl: /^https:\/\/commondatastorage\.googleapis\.com/ }
      ]
    });
    const mockVideoIds = mockVideos.map(v => v._id);
    console.log(`Found ${mockVideos.length} mock video(s) to remove.`);

    // 2. Purge Mock Docs & Disk Cleanup
    console.log("Starting disk cleanup for deleted videos...");
    for (const v of mockVideos) {
      deleteLocalFile(v.videoUrl);
      deleteLocalFile(v.thumbnailUrl);
    }

    console.log("Purging mock videos from DB...");
    const videoDeleteResult = await Video.deleteMany({ _id: { $in: mockVideoIds } });
    console.log(`Deleted ${videoDeleteResult.deletedCount} video(s) from database.`);

    console.log("Purging mock creators from DB...");
    const userDeleteResult = await User.deleteMany({ _id: { $in: mockUserIds } });
    console.log(`Deleted ${userDeleteResult.deletedCount} user(s) from database.`);

    // 3. Clean Up Real User Lists & Arrays
    console.log("Cleaning up references in real user accounts...");
    const realUsers = await User.find({ _id: { $nin: mockUserIds } });
    for (const user of realUsers) {
      let modified = false;

      // Filter watchLater
      const oldWatchLaterLen = user.watchLater.length;
      user.watchLater = user.watchLater.filter(id => !mockVideoIds.some(mId => mId.equals(id)));
      if (user.watchLater.length !== oldWatchLaterLen) {
        const removedCount = oldWatchLaterLen - user.watchLater.length;
        user.watchLaterUnreadCount = Math.max(0, (user.watchLaterUnreadCount || 0) - removedCount);
        modified = true;
      }

      // Filter subscribers
      const oldSubscribersLen = user.subscribers.length;
      user.subscribers = user.subscribers.filter(id => !mockUserIds.some(mId => mId.equals(id)));
      if (user.subscribers.length !== oldSubscribersLen) {
        modified = true;
      }

      // Filter subscriptions
      const oldSubscriptionsLen = user.subscriptions.length;
      user.subscriptions = user.subscriptions.filter(id => !mockUserIds.some(mId => mId.equals(id)));
      if (user.subscriptions.length !== oldSubscriptionsLen) {
        modified = true;
      }

      // Filter notifications (remove welcomes/updates referencing mock data)
      const oldNotificationsLen = user.notifications.length;
      user.notifications = user.notifications.filter(notif => {
        const isWelcome = notif.message.includes('Welcome to');
        const mentionsMockUser = mockUsers.some(mu => notif.message.includes(mu.fullName) || notif.message.includes(mu.channelName));
        const mentionsMockVideo = mockVideos.some(mv => notif.message.includes(mv.title));
        return !(isWelcome || mentionsMockUser || mentionsMockVideo);
      });
      if (user.notifications.length !== oldNotificationsLen) {
        modified = true;
      }

      if (modified) {
        await user.save();
        console.log(`Saved cleaned up user: ${user.fullName}`);
      }
    }

    // 4. Clean Up Real Video Lists & Arrays & Recalculate Counters
    console.log("Cleaning up comments/likes and recalculating counters for remaining videos...");
    const realVideos = await Video.find({ _id: { $nin: mockVideoIds } });
    for (const video of realVideos) {
      let modified = false;

      // Filter likedBy
      const oldLikedByLen = video.likedBy.length;
      video.likedBy = video.likedBy.filter(id => !mockUserIds.some(mId => mId.equals(id)));
      if (video.likedBy.length !== oldLikedByLen) {
        video.likes = video.likedBy.length;
        modified = true;
      }

      // Filter comments: First pass, remove comments by mock users
      const oldCommentsLen = video.comments.length;
      const commentsAfterFirstPass = video.comments.filter(comment => {
        return !mockUserIds.some(mId => mId.equals(comment.userId));
      });

      // Second pass: Cascading orphaned comments loop
      const finalComments = commentsAfterFirstPass.filter(comment => {
        if (comment.parentId !== null) {
          const parentExists = commentsAfterFirstPass.some(c => c._id.equals(comment.parentId));
          return parentExists;
        }
        return true;
      });

      if (finalComments.length !== oldCommentsLen) {
        video.comments = finalComments;
        modified = true;
      }

      if (modified) {
        await video.save();
        console.log(`Saved cleaned up video: ${video.title}`);
      }
    }

    console.log("Database and disk cleanup completed successfully!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

cleanup();
