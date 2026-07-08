import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'videostream_secret_key_123';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];

    // Support a direct local bypass string or verify the JWT token
    let clerkId;
    let email;

    if (token.startsWith('mock_token_')) {
      // Mock token format: mock_token_[clerkId]_[email]
      const parts = token.replace('mock_token_', '').split('_');
      clerkId = parts[0];
      email = parts[1];
    } else {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        clerkId = decoded.clerkId;
        email = decoded.email;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired authentication token' });
      }
    }

    if (!clerkId) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    // Load the user from MongoDB Compass database
    let user = await User.findOne({ clerkId });
    if (!user) {
      // If the user doesn't exist in MongoDB yet but we have a valid auth context,
      // we can return a 404 so the client triggers a registration flow, or create a basic one.
      // The prompt specified that SignUp POST /api/users does the synchronization,
      // so we'll expect user to exist. If not, we allow it to return 401 or auto-create for robustness.
      return res.status(401).json({ error: 'User account not synchronized in MongoDB' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Internal server authentication error' });
  }
};
