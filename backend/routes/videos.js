import express from 'express';
import Video from '../models/Video.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all videos (supports filters: watchLater, recommended, search query, category)
router.get('/', async (req, res) => {
  try {
    const { filter, q, category } = req.query;

    // Handle Watch Later private stream
    if (filter === 'watchLater') {
      // For watchLater, we require authentication.
      // We will parse the Auth header inline if present, or return 401.
      return requireAuth(req, res, async () => {
        try {
          const user = await User.findById(req.user._id).populate('watchLater');
          return res.status(200).json({ videos: user.watchLater });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: 'Failed to fetch Watch Later videos' });
        }
      });
    }

    let queryObj = {};

    if (category && category !== 'All' && category !== 'Recommended' && category !== 'Trending') {
      queryObj.category = category;
    }

    if (q) {
      queryObj.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    let query = Video.find(queryObj);

    // Recommended for User interest filter (simulated interest query or highest engagement scores)
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

// GET trending videos (sorted dynamically by high view counts or recent engagement scores)
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
    
    // Find video and increment views
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
      // Remove from Watch Later list
      user.watchLater.splice(videoIndex, 1);
      isPinned = false;
    } else {
      // Add to Watch Later list
      user.watchLater.push(id);
      isPinned = true;
    }

    await user.save();
    console.log(`User toggled watch-later for video ${id}. Pinned state: ${isPinned}`);
    res.status(200).json({
      message: isPinned ? 'Added to Watch Later' : 'Removed from Watch Later',
      isPinned,
      watchLaterCount: user.watchLater.length
    });
  } catch (error) {
    console.error('Error toggling watch-later:', error);
    res.status(500).json({ error: 'Server error toggling watch-later status' });
  }
});

export default router;
