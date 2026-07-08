import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Play, Eye, Calendar, Sparkles } from 'lucide-react';

export default function VideoCard({ video, onWatchLaterToggled }) {
  const navigate = useNavigate();
  const { user, toggleWatchLater } = useAuth();
  
  // Track if video is in user's watch later array
  const isInitiallyPinned = user?.watchLater?.includes(video._id);
  const [isPinned, setIsPinned] = useState(isInitiallyPinned);
  const [toggling, setToggling] = useState(false);

  const handleWatchLaterClick = async (e) => {
    e.stopPropagation(); // Avoid triggering navigation to video player
    if (toggling) return;
    setToggling(true);
    try {
      const state = await toggleWatchLater(video._id);
      setIsPinned(state);
      if (onWatchLaterToggled) {
        onWatchLaterToggled();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  // Format date to relative or localized string
  const formatUploadDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format large numbers (like views)
  const formatViews = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count;
  };

  return (
    <div 
      onClick={() => navigate(`/video/${video._id}`)}
      className="glass-panel rounded-2xl overflow-hidden cursor-pointer group glass-card-hover border border-slate-800 flex flex-col h-full relative"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        
        {/* Play Icon Overlay on Hover */}
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-3 rounded-full bg-indigo-500/90 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
            <Play className="w-6 h-6 fill-current" />
          </div>
        </div>

        {/* Video Duration Badge */}
        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-xs font-bold bg-black/75 text-white rounded-md tracking-wider">
          {video.duration}
        </span>

        {/* Category Tag */}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold bg-indigo-600/95 text-white rounded-md tracking-wide uppercase border border-indigo-400/20">
          {video.category}
        </span>

        {/* Watch Later Quick Trigger */}
        <button
          onClick={handleWatchLaterClick}
          disabled={toggling}
          className={`absolute top-2.5 right-2.5 p-2 rounded-lg transition-all focus:outline-none ${
            isPinned 
              ? 'bg-indigo-600 border border-indigo-400 text-white' 
              : 'bg-black/60 border border-transparent hover:border-slate-500 text-slate-300 hover:text-white'
          }`}
          title={isPinned ? 'Remove from Watch Later' : 'Add to Watch Later'}
        >
          <Clock className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Video Text Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Creator Information */}
          <div className="flex items-center gap-2">
            <img 
              src={video.creator?.avatarUrl} 
              alt={video.creator?.name} 
              className="w-5 h-5 rounded-full object-cover border border-slate-700"
            />
            <span className="text-xs text-slate-400 font-semibold truncate hover:text-indigo-400 transition-colors">
              {video.creator?.name}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-indigo-400 transition-colors">
            {video.title}
          </h4>
        </div>

        {/* Statistics Block */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-3 border-t border-slate-800/40">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{formatViews(video.views)} views</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatUploadDate(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
