import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Video, FileVideo, Image, Tag, Plus, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CreatorStudio() {
  const { user, becomeCreator, getFreshToken } = useAuth();
  const navigate = useNavigate();

  // "Become Creator" states
  const [channelName, setChannelName] = useState(user?.fullName ? `${user.fullName}'s Stream Hub` : '');
  const [channelDesc, setChannelDesc] = useState('');
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState('');

  // "Upload Video" states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [videoDuration, setVideoDuration] = useState('');

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setVideoFile(null);
      setVideoDuration('');
      return;
    }
    setVideoFile(file);
    
    try {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        const secs = videoElement.duration;
        if (!isNaN(secs) && secs > 0) {
          const mins = Math.floor(secs / 60);
          const remainingSecs = Math.floor(secs % 60);
          const durationStr = `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
          setVideoDuration(durationStr);
        } else {
          setVideoDuration('0:15');
        }
      };
      videoElement.onerror = () => {
        setVideoDuration('0:15');
      };
      videoElement.src = URL.createObjectURL(file);
    } catch (err) {
      console.error('Error getting video duration:', err);
      setVideoDuration('0:15');
    }
  };

  const handleBecomeCreator = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) {
      setActivateError('Channel Name is required');
      return;
    }

    setActivating(true);
    setActivateError('');
    try {
      await becomeCreator(channelName.trim(), channelDesc.trim());
      // Successful activation updates the user object in AuthContext, which re-renders page
    } catch (err) {
      setActivateError(err.message || 'Failed to activate creator channel');
    } finally {
      setActivating(false);
    }
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) {
      setUploadError('Please fill out all required fields');
      return;
    }
    if (!videoFile || !thumbnailFile) {
      setUploadError('Please select both a video file and a thumbnail image');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const freshToken = await getFreshToken();
      if (!freshToken) {
        throw new Error('Your authentication session has expired. Please sign out and sign in again.');
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('tags', tags.trim());
      formData.append('video', videoFile);
      formData.append('thumbnail', thumbnailFile);
      formData.append('duration', videoDuration || '0:15');

      const res = await fetch(`${API_URL}/videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freshToken}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload video');
      }

      setUploadSuccess('Video uploaded successfully! Publishing to global stream...');
      // Clear inputs
      setTitle('');
      setDescription('');
      setTags('');
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoDuration('');
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload video to servers');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  // View 1: User is not yet a Creator
  if (!user.isCreator) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Creator Studio</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Unlock broadcasting features and reach your audience</p>
        </div>

        <div className="glass-panel border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl relative overflow-hidden">
          {/* Subtle gradient background element */}
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl" />
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Join the VibeStream Creator Guild</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Become a creator to upload raw video feeds, track subscriber analytics, push global updates, and build your digital community.
              </p>
            </div>
          </div>

          {activateError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2.5 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{activateError}</span>
            </div>
          )}

          <form onSubmit={handleBecomeCreator} className="space-y-5 pt-4 border-t border-slate-900">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Channel Hub Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Synth Master Stream Hub"
                className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Channel Description</label>
              <textarea
                placeholder="Briefly describe what streams and categories you'll publish..."
                className="w-full h-28 bg-[#111424] border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium resize-none"
                value={channelDesc}
                onChange={(e) => setChannelDesc(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={activating}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-600/20"
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Channel Ledger...</span>
                </>
              ) : (
                <>
                  <span>Activate Creator Channel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // View 2: User is a Creator (Video upload form)
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Creator Studio</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Publish new video streams and broadcast to your subscribers</p>
      </div>

      <div className="glass-panel border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-900">
          <Video className="text-indigo-400 w-5 h-5" />
          <h2 className="text-base font-bold text-white">Upload New Video</h2>
        </div>

        {uploadSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2.5 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUploadVideo} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Video Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Adventures in Machine Learning"
                className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Category *</label>
              <select
                required
                className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Tech">Tech</option>
                <option value="Music">Music</option>
                <option value="Gaming">Gaming</option>
                <option value="Nature">Nature</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Video Description *</label>
            <textarea
              required
              placeholder="What is this stream about? Mention details to improve SEO indexes..."
              className="w-full h-32 bg-[#111424] border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. tech, coding, react, beginners"
              className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* File Picker Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Raw Video Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Select Video File *</label>
              <div className="border border-dashed border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 bg-[#111424]/30 text-center transition-all cursor-pointer relative group">
                <input
                  type="file"
                  required
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <FileVideo className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-bold text-slate-300">
                    {videoFile ? videoFile.name : 'Choose Video File'}
                  </span>
                  <span className="text-[10px] text-slate-500">MP4, WEBM up to 100MB</span>
                </div>
              </div>
            </div>

            {/* Thumbnail Image Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Select Custom Thumbnail *</label>
              <div className="border border-dashed border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 bg-[#111424]/30 text-center transition-all cursor-pointer relative group">
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <Image className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-bold text-slate-300">
                    {thumbnailFile ? thumbnailFile.name : 'Choose Image File'}
                  </span>
                  <span className="text-[10px] text-slate-500">PNG, JPG, WEBP up to 5MB</span>
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-900">
            <button
              type="submit"
              disabled={uploading}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-600/15"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Video Packet...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Stream</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
