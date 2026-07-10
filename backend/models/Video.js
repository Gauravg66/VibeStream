import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now }
});

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
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    default: []
  }],
  comments: [CommentSchema],
  duration: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound Text Index for search optimization
VideoSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Video', VideoSchema);
