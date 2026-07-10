import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import path from 'path';
import { fileURLToPath } from 'url';

import usersRouter from './routes/users.js';
import videosRouter from './routes/videos.js';
import notificationsRouter from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/videostream';

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
// Nodemon trigger comment - v2
