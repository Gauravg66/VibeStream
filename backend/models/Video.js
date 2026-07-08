import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Recommended', 'Trending', 'Tech', 'Music', 'Gaming', 'Nature']
  },
  views: {
    type: Number,
    default: 0
  },
  engagementScore: {
    type: Number,
    default: 0
  },
  creator: {
    name: { type: String, required: true },
    avatarUrl: { type: String, required: true }
  },
  duration: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Video', VideoSchema);
