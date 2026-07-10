import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Eye, Calendar, UserPlus, UserMinus, Heart, MessageSquare, Send, ChevronDown, ChevronUp, ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VideoPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, toggleWatchLater, getFreshToken } = useAuth();
  const { onRefreshNotifications } = useOutletContext();

  const [video, setVideo] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Like system states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);

  // Creator subscription states
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Comment states
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');

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
      setComments(data.video.comments || []);
      setLikesCount(data.video.likes || 0);

      // Verify watch later pin state
      if (user && data.video) {
        setIsPinned(user.watchLater?.includes(data.video._id));
        setIsLiked(data.video.likedBy?.includes(user._id));
      }

      // Check subscription status
      const freshToken = token || (await getFreshToken());
      if (freshToken && data.video.creatorId) {
        const creatorRes = await fetch(`${API_URL}/users/creator/${data.video.creatorId}`, {
          headers: {
            'Authorization': `Bearer ${freshToken}`
          }
        });
        if (creatorRes.ok) {
          const creatorData = await creatorRes.json();
          setIsSubscribed(creatorData.isSubscribed);
        }
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
        onRefreshNotifications();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const handleLikeClick = async () => {
    const freshToken = await getFreshToken();
    if (!freshToken) {
      navigate('/login');
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch(`${API_URL}/videos/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freshToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.isLiked);
        setLikesCount(data.likes);
      }
    } catch (err) {
      console.error('Like toggle error:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleSubscribeClick = async () => {
    const freshToken = await getFreshToken();
    if (!freshToken) {
      navigate('/login');
      return;
    }
    if (!video || !video.creatorId || subscribing) return;
    setSubscribing(true);
    try {
      const res = await fetch(`${API_URL}/users/${video.creatorId}/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freshToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsSubscribed(data.isSubscribed);
      }
    } catch (err) {
      console.error('Subscribe toggle error:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const freshToken = await getFreshToken();
    if (!newComment.trim() || !freshToken || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_URL}/videos/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshToken}`
        },
        body: JSON.stringify({ text: newComment.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setNewComment('');
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    const freshToken = await getFreshToken();
    if (!replyText.trim() || !freshToken) return;

    try {
      const res = await fetch(`${API_URL}/videos/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshToken}`
        },
        body: JSON.stringify({ text: replyText.trim(), parentId })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setReplyText('');
        setActiveReplyId(null);
      }
    } catch (err) {
      console.error('Reply comment error:', err);
    }
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

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);
  const isCreatorSelf = user && video.creatorId && user._id === video.creatorId;

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
              {/* Like Button */}
              <button
                onClick={handleLikeClick}
                disabled={liking}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none ${
                  isLiked 
                    ? 'bg-rose-600/20 border border-rose-500 text-rose-400' 
                    : 'bg-[#111424]/60 border border-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
                <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
              </button>

              {/* Watch Later */}
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
          <div 
            onClick={() => video.creatorId && navigate(`/creator/${video.creatorId}`)} 
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <img 
              src={video.creator?.avatarUrl} 
              alt={video.creator?.name} 
              className="w-12 h-12 rounded-full object-cover border border-slate-700 group-hover:border-indigo-500 transition-colors"
            />
            <div>
              <p className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">{video.creator?.name}</p>
              <p className="text-xs text-slate-500 font-semibold">Content Creator</p>
            </div>
          </div>

          {/* Subscribe Toggle */}
          {video.creatorId && !isCreatorSelf && (
            <button
              onClick={handleSubscribeClick}
              disabled={subscribing}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 focus:outline-none shadow-md ${
                isSubscribed 
                  ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-400 border border-slate-800 hover:text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-550 text-white shadow-indigo-600/10'
              }`}
            >
              {isSubscribed ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  <span>Subscribed</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Subscribe</span>
                </>
              )}
            </button>
          )}
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
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {video.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-[#111424] border border-slate-850 text-[10px] font-semibold text-indigo-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Local Comments list */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold tracking-wide text-white">Discussion ({comments.length})</h3>
          </div>

          {/* Form */}
          {user ? (
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
                  disabled={submittingComment}
                />
                <button 
                  type="submit" 
                  disabled={submittingComment}
                  className="absolute right-2 top-2.5 p-1 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50"
                >
                  {submittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4 bg-[#111424]/20 border border-slate-900 rounded-xl">
              Please <button onClick={() => navigate('/login')} className="text-indigo-400 font-bold hover:underline">sign in</button> to join the discussion.
            </p>
          )}

          {/* List */}
          <div className="space-y-4">
            {rootComments.map((comment) => {
              const replies = getReplies(comment._id);
              return (
                <div key={comment._id} className="space-y-3">
                  
                  {/* Root Card */}
                  <div className="flex gap-4 p-4 rounded-xl bg-[#111424]/20 border border-slate-900/60">
                    <img 
                      src={comment.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=fallback'} 
                      alt={comment.author} 
                      className="w-9 h-9 rounded-full object-cover border border-slate-800"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{comment.author}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-350 leading-relaxed">{comment.text}</p>
                      
                      {/* Actions row */}
                      {user && (
                        <div className="pt-1">
                          <button 
                            onClick={() => {
                              setActiveReplyId(activeReplyId === comment._id ? null : comment._id);
                              setReplyText('');
                            }}
                            className="text-xs text-indigo-450 hover:text-indigo-400 font-bold tracking-wide transition-colors focus:outline-none"
                          >
                            Reply
                          </button>
                        </div>
                      )}

                      {/* Reply Form */}
                      {activeReplyId === comment._id && (
                        <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="mt-3 flex gap-3">
                          <input 
                            type="text"
                            placeholder={`Reply to ${comment.author}...`}
                            className="flex-1 bg-[#0A0C16] border border-slate-850 rounded-xl py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            required
                            autoFocus
                          />
                          <button 
                            type="submit"
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-550 rounded-xl text-[10px] font-bold uppercase text-white transition-colors"
                          >
                            Post
                          </button>
                          <button 
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-bold uppercase text-slate-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Replies List */}
                  {replies.length > 0 && (
                    <div className="pl-12 border-l-2 border-slate-900 space-y-3 mt-1 ml-4">
                      {replies.map((reply) => (
                        <div key={reply._id} className="flex gap-4 p-3 rounded-xl bg-[#111424]/10 border border-slate-950/20">
                          <img 
                            src={reply.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=fallback'} 
                            alt={reply.author} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-800"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{reply.author}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-350 leading-relaxed">{reply.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
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
