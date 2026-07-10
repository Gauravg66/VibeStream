import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { UserPlus, UserMinus, Video, AlertCircle, Compass } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CreatorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, getFreshToken } = useAuth();

  const [creator, setCreator] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCreatorProfile();
  }, [id, token]);

  const fetchCreatorProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/users/creator/${id}`, { headers });
      if (!res.ok) {
        throw new Error('Creator profile not found');
      }

      const data = await res.json();
      setCreator(data.creator);
      setVideos(data.videos || []);
      setIsSubscribed(data.isSubscribed);
      setSubscribersCount(data.creator.subscribersCount || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch creator channel details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeToggle = async () => {
    const freshToken = await getFreshToken();
    if (!freshToken) {
      navigate('/login');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/users/${id}/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freshToken}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to toggle subscription');
      }

      const data = await res.json();
      setIsSubscribed(data.isSubscribed);
      setSubscribersCount(data.subscribersCount);
    } catch (err) {
      console.error('Subscription error:', err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Loading channel profile...</span>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="p-8 glass-panel border border-red-500/30 text-center rounded-2xl max-w-md mx-auto space-y-4">
        <p className="text-red-400 font-semibold">{error || 'Channel could not be loaded.'}</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all text-white"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const isSelf = user && user._id === id;

  return (
    <div className="space-y-8">
      {/* Banner / Hero header card */}
      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="h-40 bg-gradient-to-r from-purple-800 via-indigo-700 to-indigo-900 relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Profile Stats Stack */}
        <div className="px-8 pb-6 relative flex flex-col items-center sm:items-start sm:flex-row gap-5 -mt-10">
          <img 
            src={creator.avatarUrl} 
            alt={creator.channelName} 
            className="w-24 h-24 rounded-full object-cover border-4 border-[#0A0C16] bg-slate-900 shadow-2xl shrink-0"
          />

          <div className="text-center sm:text-left pt-12 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">{creator.channelName}</h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">@{creator.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}</p>
              </div>

              {/* Sub Button */}
              {!isSelf && (
                <button
                  onClick={handleSubscribeToggle}
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 focus:outline-none shadow-md ${
                    isSubscribed 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-750' 
                      : 'bg-indigo-600 hover:bg-indigo-550 text-white shadow-indigo-600/15'
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

            {/* Subscriber stats */}
            <div className="flex items-center gap-6 justify-center sm:justify-start text-xs text-slate-400 font-medium">
              <div>
                <span className="text-white font-bold text-sm">{subscribersCount.toLocaleString()}</span> subscribers
              </div>
              <div className="w-1.5 h-1.5 bg-slate-850 rounded-full" />
              <div>
                <span className="text-white font-bold text-sm">{videos.length}</span> videos
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl pt-2">
              {creator.channelDescription || `Welcome to the official video hub. Stay tuned for exciting streams and guides.`}
            </p>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">Published Streams ({videos.length})</h2>
        </div>

        {videos.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500 space-y-4 glass-panel border border-slate-800/40 rounded-2xl">
            <Compass className="w-12 h-12 stroke-[1.2] text-indigo-400/60" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">No videos uploaded yet</p>
              <p className="text-xs font-medium">This creator hasn't published any video packets to VibeStream.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard 
                key={video._id} 
                video={video} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
