import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Bell, Star, Flame, LogOut, Video, Compass } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Sidebar({ onOpenNotifications, unreadCount, onRefreshUnread }) {
  const { user, logout, watchLaterCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current active filter from query parameters
  const queryParams = new URLSearchParams(location.search);
  const activeFilter = queryParams.get('filter') || '';
  const currentPath = location.pathname;

  const handleFilterClick = (filterName) => {
    navigate(`/?filter=${filterName}`);
  };

  const isFilterActive = (filterName) => {
    return currentPath === '/' && activeFilter === filterName;
  };

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-[#0B0F19] border-r border-slate-900 flex flex-col justify-between z-40 text-white select-none">
      {/* Top Sidebar Section */}
      <div className="flex-1 flex flex-col pt-6 px-4 space-y-7">
        
        {/* Brand/Logo Anchor */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2.5 px-3 cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">
            VibeStream
          </span>
        </div>

        {/* Greeting Profile Anchor */}
        {user && (
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#111424]/40 border border-slate-800/40 hover:border-indigo-500/30 hover:bg-[#111424]/80 cursor-pointer transition-all group"
          >
            <img 
              src={user.avatarUrl} 
              alt={user.fullName} 
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20 group-hover:border-indigo-500/60 transition-colors"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Welcome</p>
              <p className="text-sm font-semibold truncate text-slate-200 group-hover:text-white transition-colors">
                Hey, {user.fullName.split(' ')[0]}
              </p>
            </div>
          </div>
        )}

        {/* Main Navigation Query Stream Switches */}
        <nav className="space-y-1.5">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-3 mb-2.5">
            Discover
          </p>

          {/* All Videos */}
          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all focus:outline-none ${
              currentPath === '/' && activeFilter === ''
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4" />
              <span>Browse Feed</span>
            </div>
          </button>

          {/* Recommended for User */}
          <button
            onClick={() => handleFilterClick('recommended')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all focus:outline-none ${
              isFilterActive('recommended')
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4" />
              <span>Recommended</span>
            </div>
          </button>

          {/* Trending Videos */}
          <button
            onClick={() => handleFilterClick('trending')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all focus:outline-none ${
              isFilterActive('trending')
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <Flame className="w-4 h-4" />
              <span>Trending</span>
            </div>
          </button>

          {/* Private Watch Later Collection */}
          <button
            onClick={() => handleFilterClick('watchLater')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all focus:outline-none ${
              isFilterActive('watchLater')
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4" />
              <span>Watch Later</span>
            </div>
            {watchLaterCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full">
                {watchLaterCount}
              </span>
            )}
          </button>

          {/* Notifications Drawer Switch */}
          <button
            onClick={onOpenNotifications}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/20 focus:outline-none relative`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              <span>Activity Logs</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

        </nav>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-900">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all focus:outline-none"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
