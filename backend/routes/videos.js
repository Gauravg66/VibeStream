import express from 'express';
import Video from '../models/Video.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB file limit
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper for streaming file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, resourceType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// GET all videos (supports filters: watchLater, recommended, search query, category)
router.get('/', async (req, res) => {
  try {
    const { filter, q, category } = req.query;

    // Handle Watch Later private stream
    if (filter === 'watchLater') {
      return requireAuth(req, res, async () => {
        try {
          const user = await User.findById(req.user._id).populate('watchLater');
          user.watchLaterUnreadCount = 0;
          await user.save();
          return res.status(200).json({ videos: user.watchLater || [], watchLaterUnreadCount: 0 });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: 'Failed to fetch Watch Later videos' });
        }
      });
    }

    // Handle Liked videos private stream
    if (filter === 'liked') {
      return requireAuth(req, res, async () => {
        try {
          const videos = await Video.find({ likedBy: req.user._id }).sort({ createdAt: -1 });
          return res.status(200).json({ videos });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: 'Failed to fetch liked videos' });
        }
      });
    }

    let queryObj = {};

    if (category && category !== 'All' && category !== 'Recommended' && category !== 'Trending') {
      queryObj.category = category;
    }

    if (q) {
      try {
        // Try text index search first
        const textResults = await Video.find({ $text: { $search: q } });
        if (textResults.length > 0) {
          queryObj.$text = { $search: q };
        } else {
          // Fall back to regex query if no exact full-word matches
          queryObj.$or = [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } }
          ];
        }
      } catch (err) {
        // Safe regex fallback if text search throws (e.g. index build in progress)
        queryObj.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ];
      }
    }

    let query = Video.find(queryObj);

    if (filter === 'recommended' || category === 'Recommended') {
      query = query.sort({ engagementScore: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const videos = await query;
    res.status(200).json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Server error fetching videos' });
  }
});

// GET trending videos (sorted dynamically by view counts)
router.get('/trending', async (req, res) => {
  try {
    const videos = await Video.find({}).sort({ views: -1 }).limit(10);
    res.status(200).json({ videos });
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    res.status(500).json({ error: 'Server error fetching trending videos' });
  }
});

// GET individual video details (increments view count)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.status(200).json({ video });
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ error: 'Server error fetching video details' });
  }
});

// POST toggle watch-later status of a video for the authenticated user
router.post('/:id/watch-later', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const videoExists = await Video.findById(id);
    if (!videoExists) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const user = await User.findById(req.user._id);
    const videoIndex = user.watchLater.indexOf(id);
    let isPinned = false;

    if (videoIndex > -1) {
      user.watchLater.splice(videoIndex, 1);
      isPinned = false;
      user.watchLaterUnreadCount = Math.max(0, (user.watchLaterUnreadCount || 0) - 1);
    } else {
      user.watchLater.push(id);
      isPinned = true;
      user.watchLaterUnreadCount = (user.watchLaterUnreadCount || 0) + 1;
    }

    await user.save();
    console.log(`User toggled watch-later for video ${id}. Pinned state: ${isPinned}. Unread count: ${user.watchLaterUnreadCount}`);
    res.status(200).json({
      message: isPinned ? 'Added to Watch Later' : 'Removed from Watch Later',
      isPinned,
      watchLaterCount: user.watchLaterUnreadCount
    });
  } catch (error) {
    console.error('Error toggling watch-later:', error);
    res.status(500).json({ error: 'Server error toggling watch-later status' });
  }
});

// POST upload new video
router.post('/', requireAuth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    if (!req.files || !req.files.video || !req.files.thumbnail) {
      return res.status(400).json({ error: 'Both video and thumbnail files are required' });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail[0];

    let videoUrl = '';
    let thumbnailUrl = '';

    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                  process.env.CLOUDINARY_API_KEY && 
                                  process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
      console.log('Uploading media to Cloudinary...');
      videoUrl = await uploadToCloudinary(videoFile.buffer, 'video');
      thumbnailUrl = await uploadToCloudinary(thumbnailFile.buffer, 'image');
    } else {
      console.log('Cloudinary not configured. Falling back to local storage.');
      const localUploadDir = path.resolve('uploads');
      if (!fs.existsSync(localUploadDir)) {
        fs.mkdirSync(localUploadDir, { recursive: true });
      }

      const videoFilename = `${Date.now()}-${videoFile.originalname.replace(/\s+/g, '_')}`;
      fs.writeFileSync(path.join(localUploadDir, videoFilename), videoFile.buffer);
      videoUrl = `${req.protocol}://${req.get('host')}/uploads/${videoFilename}`;

      const thumbnailFilename = `${Date.now()}-${thumbnailFile.originalname.replace(/\s+/g, '_')}`;
      fs.writeFileSync(path.join(localUploadDir, thumbnailFilename), thumbnailFile.buffer);
      thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${thumbnailFilename}`;
    }

    const parsedTags = tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    const newVideo = new Video({
      title: title.trim(),
      description: description.trim(),
      videoUrl,
      thumbnailUrl,
      category,
      duration: '3:00',
      creator: {
        name: req.user.channelName || req.user.fullName,
        avatarUrl: req.user.avatarUrl
      },
      creatorId: req.user._id,
      tags: parsedTags,
      views: 0,
      engagementScore: 50
    });

    const savedVideo = await newVideo.save();
    console.log(`Video uploaded: ${savedVideo.title} by ${req.user.fullName}`);

    // Push notification to subscribers
    const subscribers = await User.find({ subscriptions: req.user._id });
    for (const sub of subscribers) {
      sub.notifications.push({
        message: `New video upload: ${req.user.channelName || req.user.fullName} published "${savedVideo.title}"!`
      });
      await sub.save();
    }

    res.status(201).json({ message: 'Video uploaded successfully', video: savedVideo });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Server error uploading video' });
  }
});

// POST toggle like status of a video
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const userId = req.user._id;
    const likedIndex = video.likedBy.indexOf(userId);
    let isLiked = false;

    if (likedIndex > -1) {
      video.likedBy.splice(likedIndex, 1);
      video.likes = Math.max(0, video.likes - 1);
      isLiked = false;
    } else {
      video.likedBy.push(userId);
      video.likes += 1;
      isLiked = true;

      // Notify video creator
      if (video.creatorId && video.creatorId.toString() !== userId.toString()) {
        const creator = await User.findById(video.creatorId);
        if (creator) {
          creator.notifications.push({
            message: `${req.user.fullName} liked your video "${video.title}"!`
          });
          await creator.save();
        }
      }
    }

    await video.save();
    res.status(200).json({ message: isLiked ? 'Liked video' : 'Unliked video', isLiked, likes: video.likes });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Server error toggling like' });
  }
});

// POST add comment or nested reply
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, parentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const commentObj = {
      author: req.user.fullName,
      avatarUrl: req.user.avatarUrl,
      text: text.trim(),
      userId: req.user._id,
      parentId: parentId || null,
      createdAt: new Date()
    };

    video.comments.push(commentObj);
    video.engagementScore = Math.min(100, video.engagementScore + 2);
    
    await video.save();

    const newComment = video.comments[video.comments.length - 1];

    // Notify creator
    if (!parentId && video.creatorId && video.creatorId.toString() !== req.user._id.toString()) {
      const creator = await User.findById(video.creatorId);
      if (creator) {
        creator.notifications.push({
          message: `${req.user.fullName} commented on your video: "${text.substring(0, 30)}..."`
        });
        await creator.save();
      }
    }

    res.status(201).json({ message: 'Comment posted', comment: newComment, comments: video.comments });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Server error posting comment' });
  }
});

export default router;
