import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Eye, Calendar, UserPlus, Heart, MessageSquare, Send, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function VideoPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, toggleWatchLater } = useAuth();
  const { onRefreshNotifications } = useOutletContext();

  const [video, setVideo] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Local comments mock state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Load video details and recommendation side streams
  useEffect(() => {
    fetchVideoDetails();
    fetchRecommendations();
  }, [id, token]);

  const fetchVideoDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/videos/${id}`);
      if (!res.ok) {
        throw new Error('Video not found');
      }
      const data = await res.json();
      setVideo(data.video);

      // Verify watch later pin state
      if (user && data.video) {
        setIsPinned(user.watchLater?.includes(data.video._id));
      }
      
      // Load mock comments from localStorage for this specific video
      const savedComments = localStorage.getItem(`comments_${id}`);
      if (savedComments) {
        setComments(JSON.parse(savedComments));
      } else {
        const initialComments = [
          { id: '1', author: 'Jane Dev', text: 'This explanation of React state routing is incredible!', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80', date: '2 hours ago' },
          { id: '2', author: 'Markus Tech', text: 'Awesome MP4 stream qualities. Clean UI too.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80', date: '1 day ago' }
        ];
        setComments(initialComments);
        localStorage.setItem(`comments_${id}`, JSON.stringify(initialComments));
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to video API');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${API_URL}/videos`);
      if (res.ok) {
        const data = await res.json();
        // Exclude current video from sidebar list
        const filtered = (data.videos || []).filter((v) => v._id !== id);
        setRecommendations(filtered.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWatchLaterClick = async () => {
    if (!video || toggling) return;
    setToggling(true);
    try {
      const state = await toggleWatchLater(video._id);
      setIsPinned(state);
      if (onRefreshNotifications) {
        onRefreshNotifications(); // update unread bell alerts
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const commentObj = {
      id: Date.now().toString(),
      author: user.fullName,
      text: newComment.trim(),
      avatar: user.avatarUrl,
      date: 'Just now'
    };

    const updatedComments = [commentObj, ...comments];
    setComments(updatedComments);
    localStorage.setItem(`comments_${id}`, JSON.stringify(updatedComments));
    setNewComment('');
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Streaming video packets...</span>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="p-8 glass-panel border border-red-500/30 text-center rounded-2xl max-w-md mx-auto space-y-4">
        <p className="text-red-400 font-semibold">{error || 'Video could not be loaded.'}</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all text-white"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Columns - Video Frame & Info */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Back navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Video Player Box */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800">
          <video
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        </div>

        {/* Video Metadata Panel */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-white leading-snug">{video.title}</h1>
          
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-900">
            <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4.5 h-4.5" />
                <span>{video.views?.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5" />
                <span>{new Date(video.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Action Grid Pinned Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleWatchLaterClick}
                disabled={toggling}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none ${
                  isPinned 
                    ? 'bg-indigo-600 border border-indigo-400 text-white' 
                    : 'bg-[#111424]/60 border border-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <Clock className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                <span>{isPinned ? 'Saved in Library' : 'Watch Later'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Creator Identity Anchor */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#111424]/40 border border-slate-800/40">
          <div className="flex items-center gap-3.5">
            <img 
              src={video.creator?.avatarUrl} 
              alt={video.creator?.name} 
              className="w-12 h-12 rounded-full object-cover border border-slate-700"
            />
            <div>
              <p className="font-bold text-white text-base">{video.creator?.name}</p>
              <p className="text-xs text-slate-500 font-semibold">Content Creator</p>
            </div>
          </div>
        </div>

        {/* Expandable Description Details Card */}
        <div className="glass-panel border border-slate-800/60 rounded-2xl p-5 space-y-3">
          <div 
            onClick={() => setIsDescExpanded(!isDescExpanded)} 
            className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-200 select-none"
          >
            <span>Video Description</span>
            {isDescExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          <p className={`text-sm text-slate-400 leading-relaxed ${isDescExpanded ? '' : 'line-clamp-2'}`}>
            {video.description}
          </p>
        </div>

        {/* Interactive Local Comments list */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold tracking-wide text-white">Discussion ({comments.length})</h3>
          </div>

          {/* Form */}
          {user && (
            <form onSubmit={handleCommentSubmit} className="flex gap-4">
              <img 
                src={user.avatarUrl} 
                alt={user.fullName} 
                className="w-9 h-9 rounded-full object-cover border border-slate-800"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Share your thoughts about this stream..."
                  className="w-full bg-[#111424] border border-slate-800 rounded-xl py-2.5 pl-4 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="absolute right-2 top-2 p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-[#111424]/20 border border-slate-900/60">
                <img 
                  src={comment.avatar} 
                  alt={comment.author} 
                  className="w-9 h-9 rounded-full object-cover border border-slate-800"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{comment.author}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{comment.date}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column - Recommendations Sidebar */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold tracking-wide text-white">Up Next</h3>
        
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div 
              key={rec._id}
              onClick={() => navigate(`/video/${rec._id}`)}
              className="flex gap-3 cursor-pointer group glass-panel hover:bg-[#111424]/60 border border-slate-900 rounded-xl p-2.5 transition-all"
            >
              {/* Mini-thumbnail */}
              <div className="relative w-28 aspect-video rounded-lg overflow-hidden shrink-0 bg-slate-900">
                <img 
                  src={rec.thumbnailUrl} 
                  alt={rec.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.2 text-[9px] font-bold bg-black/85 text-white rounded">
                  {rec.duration}
                </span>
              </div>

              {/* Mini-info */}
              <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                <h4 className="text-xs font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-400 transition-colors">
                  {rec.title}
                </h4>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-semibold truncate">
                    {rec.creator?.name}
                  </p>
                  <p className="text-[9px] text-slate-500 font-semibold">
                    {rec.views?.toLocaleString()} views
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
