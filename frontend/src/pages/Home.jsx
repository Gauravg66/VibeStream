import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { Search, Compass, Clock, Flame, Star, AlertCircle, RefreshCw, ThumbsUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Home() {
  const { token, getFreshToken, clearWatchLaterBadge } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { onRefreshNotifications } = useOutletContext();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Extract filters from URL queries
  const queryParams = new URLSearchParams(location.search);
  const filter = queryParams.get('filter') || '';
  const searchQ = queryParams.get('q') || '';

  // Synchronize category selectors with URL changes
  useEffect(() => {
    fetchFeed();
  }, [filter, searchQ, activeCategory, token]);

  const fetchFeed = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_URL}/videos`;
      const headers = {};

      const freshToken = token ? (await getFreshToken()) : null;
      if (freshToken) {
        headers['Authorization'] = `Bearer ${freshToken}`;
      }

      // 1. Trending API route mapping
      if (filter === 'trending') {
        url = `${API_URL}/videos/trending`;
      } 
      // 2. Filter query bindings (watchLater / recommended / search queries)
      else {
        const params = new URLSearchParams();
        if (filter) params.append('filter', filter);
        if (searchQ) params.append('q', searchQ);
        if (activeCategory !== 'All') params.append('category', activeCategory);
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch videos from server');
      }

      const data = await res.json();
      setVideos(data.videos || []);
      if (filter === 'watchLater') {
        clearWatchLaterBadge();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to connect to the video streaming API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate('/');
    }
  };

  // Helper title for current stream headers
  const getFeedTitle = () => {
    if (searchQ) return `Search Results for "${searchQ}"`;
    if (filter === 'watchLater') return 'My Private Watch Later List';
    if (filter === 'liked') return 'My Liked Videos';
    if (filter === 'trending') return 'Trending Videos';
    if (filter === 'recommended') return 'Recommended for You';
    return `${activeCategory} Videos`;
  };

  const getFeedIcon = () => {
    if (filter === 'watchLater') return <Clock className="w-5 h-5 text-indigo-400" />;
    if (filter === 'liked') return <ThumbsUp className="w-5 h-5 text-indigo-400" />;
    if (filter === 'trending') return <Flame className="w-5 h-5 text-red-400 animate-pulse" />;
    if (filter === 'recommended') return <Star className="w-5 h-5 text-yellow-400" />;
    return <Compass className="w-5 h-5 text-indigo-400" />;
  };

  const categories = ['All', 'Tech', 'Music', 'Gaming', 'Nature'];

  return (
    <div className="space-y-7">
      
      {/* Header Canvas Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            {getFeedIcon()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">{getFeedTitle()}</h1>
            <p className="text-xs text-slate-500 font-medium">Explore premium streams handpicked for you</p>
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search videos, tags..."
            className="w-full bg-[#111424] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </form>
      </div>

      {/* Category Horizontal Filters (only when not on Watch Later / Trending / Recommended) */}
      {!filter && !searchQ && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all focus:outline-none ${
                activeCategory === cat
                  ? 'bg-indigo-600 border border-indigo-400 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-[#111424]/40 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-[#111424]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Canvas Video Cards Grid */}
      {loading ? (
        // Premium CSS Shimmer grid loader
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="glass-panel border border-slate-900 rounded-2xl overflow-hidden aspect-video flex flex-col space-y-4">
              <div className="shimmer w-full aspect-video flex-1" />
              <div className="p-4 space-y-3">
                <div className="shimmer h-4 w-3/4 rounded-md" />
                <div className="shimmer h-3 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <span className="font-semibold text-sm">{error}</span>
          <button 
            onClick={fetchFeed} 
            className="ml-4 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-bold transition-all"
          >
            Retry
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center text-slate-500 space-y-4 glass-panel border border-slate-800/40 rounded-2xl">
          <Compass className="w-16 h-16 stroke-[1.2] text-indigo-400/60 animate-pulse" />
          <div className="space-y-1">
            <p className="text-base font-semibold text-white">No videos found</p>
            <p className="text-sm font-medium">Try updating your filters, queries, or pinning new items.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard 
              key={video._id} 
              video={video} 
              onWatchLaterToggled={onRefreshNotifications}
            />
          ))}
        </div>
      )}
    </div>
  );
}
