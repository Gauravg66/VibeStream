import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { Search, Compass, AlertCircle, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { token, getFreshToken } = useAuth();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchSearchResults();
  }, [query, activeCategory, token]);

  const fetchSearchResults = async () => {
    if (!query) {
      setVideos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (activeCategory !== 'All') {
        params.append('category', activeCategory);
      }

      const headers = {};
      const freshToken = token ? (await getFreshToken()) : null;
      if (freshToken) {
        headers['Authorization'] = `Bearer ${freshToken}`;
      }

      const res = await fetch(`${API_URL}/videos?${params.toString()}`, { headers });
      if (!res.ok) {
        throw new Error('Failed to fetch search results');
      }

      const data = await res.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to connect to video API.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Tech', 'Music', 'Gaming', 'Nature'];

  return (
    <div className="space-y-7">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Search Results for "{query}"
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Found {videos.length} matching streams across titles, descriptions, and tags
            </p>
          </div>
        </div>
      </div>

      {/* Category filters */}
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

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
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
            onClick={fetchSearchResults} 
            className="ml-4 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-bold transition-all"
          >
            Retry
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center text-slate-500 space-y-4 glass-panel border border-slate-800/40 rounded-2xl">
          <Compass className="w-16 h-16 stroke-[1.2] text-indigo-400/60" />
          <div className="space-y-1">
            <p className="text-base font-semibold text-white">No results found</p>
            <p className="text-sm font-medium">Try checking your spelling, using different keywords, or broadening your filters.</p>
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
  );
}
