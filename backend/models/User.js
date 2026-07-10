import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  watchLater: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  watchLaterUnreadCount: {
    type: Number,
    default: 0
  },
  isCreator: {
    type: Boolean,
    default: false
  },
  channelName: {
    type: String,
    default: ''
  },
  channelDescription: {
    type: String,
    default: ''
  },
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subscriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notifications: [NotificationSchema]
}, {
  timestamps: true
});

export default mongoose.model('User', UserSchema);
