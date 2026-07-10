import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

// 1. Initialize Database & Cloud Configurations
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gauravgupta38536_db_user:xq7J4dNWy2voACEm@cluster0.oqtjzf8.mongodb.net/?appName=Cluster0";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define local absolute directory pathways
const __dirname = path.resolve();
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Inline Schema Blueprint to avoid model import crashes
const videoSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
  thumbnailUrl: String,
});
const Video = mongoose.model('Video', videoSchema);

async function runMigration() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas cloud database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected safely to Atlas.');

    // Find documents pointing to local hardcoded strings
    const localVideos = await Video.find({
      $or: [
        { videoUrl: { $regex: 'localhost' } },
        { thumbnailUrl: { $regex: 'localhost' } }
      ]
    });

    console.log(`🔍 Found ${localVideos.length} video documents with local assets path variables.\n`);

    for (const video of localVideos) {
      console.log(`📦 Migrating Record: "${video.title}"`);

      // Extract raw filenames from url string paths
      const videoFilename = video.videoUrl.split('/uploads/')[1];
      const thumbFilename = video.thumbnailUrl.split('/uploads/')[1];

      const absoluteVideoPath = path.join(UPLOADS_DIR, videoFilename);
      const absoluteThumbPath = path.join(UPLOADS_DIR, thumbFilename);

      let updatedVideoUrl = video.videoUrl;
      let updatedThumbUrl = video.thumbnailUrl;

      // Upload local video asset file to Cloudinary if it exists on local server storage
      if (fs.existsSync(absoluteVideoPath)) {
        console.log(`   🚀 Uploading Video stream binary to Cloudinary (${videoFilename})...`);
        const videoUploadResult = await cloudinary.uploader.upload(absoluteVideoPath, {
          resource_type: 'video',
          folder: 'videostream_assets'
        });
        updatedVideoUrl = videoUploadResult.secure_url;
        console.log(`   🔹 Cloudinary Video URL Generated: ${updatedVideoUrl}`);
      } else {
        console.log(`   ⚠️ Warning: Video file not found locally on path: ${absoluteVideoPath}`);
      }

      // Upload local thumbnail asset image file to Cloudinary
      if (fs.existsSync(absoluteThumbPath)) {
        console.log(`   🚀 Uploading Thumbnail graphic binary to Cloudinary (${thumbFilename})...`);
        const thumbUploadResult = await cloudinary.uploader.upload(absoluteThumbPath, {
          resource_type: 'image',
          folder: 'videostream_thumbnails'
        });
        updatedThumbUrl = thumbUploadResult.secure_url;
        console.log(`   🔹 Cloudinary Thumbnail URL Generated: ${updatedThumbUrl}`);
      } else {
        console.log(`   ⚠️ Warning: Thumbnail image not found locally on path: ${absoluteThumbPath}`);
      }

      // Commit the updated URL ledgers straight into your MongoDB Atlas cloud document
      await Video.findByIdAndUpdate(video._id, {
        videoUrl: updatedVideoUrl,
        thumbnailUrl: updatedThumbUrl
      });
      console.log(`✅ Record ledger synchronized securely inside MongoDB Atlas!\n`);
    }

    console.log('🎉 Media asset database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed due to internal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected safely from MongoDB cluster.');
  }
}

runMigration();
