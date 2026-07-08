import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import usersRouter from './routes/users.js';
import videosRouter from './routes/videos.js';
import notificationsRouter from './routes/notifications.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/videostream';
const JWT_SECRET = process.env.JWT_SECRET || 'videostream_secret_key_123';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory OTP storage for the Mock Clerk Auth sequence
const otpStore = new Map();

// 1. Mock Clerk Route: Send OTP to Email
app.post('/api/auth/mock-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    console.log(`\n==================================================`);
    console.log(`[MOCK CLERK AUTH] OTP generated for: ${email}`);
    console.log(`[MOCK CLERK AUTH] Verification Code: ${otp}`);
    console.log(`==================================================\n`);

    // Return the OTP in response in DEV mode so the frontend can toast it
    res.status(200).json({
      message: 'OTP dispatched successfully (Check server logs)',
      devOtp: otp // Returned for easy automated testing and UI demonstration
    });
  } catch (error) {
    console.error('Error generating mock OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 2. Mock Clerk Route: Verify OTP
app.post('/api/auth/mock-verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const record = otpStore.get(email.toLowerCase());
    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    // Verification successful, clear OTP
    otpStore.delete(email.toLowerCase());

    // Check if user exists in MongoDB Compass database
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    // Create a mock clerkId based on the email (hash or slug)
    const clerkId = existingUser ? existingUser.clerkId : `user_${Math.random().toString(36).substr(2, 9)}`;

    // Generate JWT token (session token)
    const token = jwt.sign(
      { clerkId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'OTP verified successfully',
      token,
      clerkId,
      email: email.toLowerCase(),
      userExists: !!existingUser,
      user: existingUser || null
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Bind API Routers
app.use('/api/users', usersRouter);
app.use('/api/videos', videosRouter);
app.use('/api/notifications', notificationsRouter);

// Root Status Endpoint
app.get('/', (req, res) => {
  res.send('VibeStream Backend Server is running successfully!');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// DB Connection and Server Start
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB database at ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`Express Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
