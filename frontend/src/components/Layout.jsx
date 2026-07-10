import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import NotificationsDrawer from './NotificationsDrawer';
import { Search, Bell, Sparkles, Plus, Video, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Layout() {
  const { isAuthenticated, loading, token, user, getFreshToken } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Sync search input with query params
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    setSearchVal(q || '');
  }, [location.search]);

  // Poll for notifications unread count
  useEffect(() => {
    if (!token) return;
    
    const fetchUnread = async () => {
      try {
        const freshToken = await getFreshToken();
        if (!freshToken) return;
        const res = await fetch(`${API_URL}/notifications`, {
          headers: {
            'Authorization': `Bearer ${freshToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const unread = (data.notifications || []).filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Error fetching unread notifications:', err);
      }
    };

    fetchUnread();
    
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleRefreshUnread = async () => {
    try {
      const freshToken = await getFreshToken();
      if (!freshToken) return;
      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${freshToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const unread = (data.notifications || []).filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C16] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide text-indigo-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0A0C16] text-[#F3F4F6] flex">
      {/* Fixed Sidebar Navigation */}
      <Sidebar 
        onOpenNotifications={() => setIsNotificationsOpen(true)} 
        unreadCount={unreadCount}
        onRefreshUnread={handleRefreshUnread}
      />

      {/* Main Canvas Scroll Area */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col relative">
        {/* Global Top Navbar */}
        <header className="sticky top-0 z-30 bg-[#0A0C16]/95 backdrop-blur-md border-b border-slate-900 px-8 py-4 flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            {user && (
              <span className="text-sm font-medium text-slate-400">
                Welcome back, <button onClick={() => navigate('/profile')} className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-all focus:outline-none">{user.fullName.split(' ')[0]}</button>
              </span>
            )}
          </div>

          {/* Search bar form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search streams, channels, tags..."
              className="w-full bg-[#111424] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </form>

          {/* Header Controls */}
          <div className="flex items-center gap-4 shrink-0">
            {user && (
              user.isCreator ? (
                <button 
                  onClick={() => navigate('/creator-studio')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none shadow-md shadow-indigo-600/15"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Upload Video</span>
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/creator-studio')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none shadow-md shadow-indigo-600/15"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden md:inline">Become Creator</span>
                </button>
              )
            )}

            {/* Notification Bell Badge */}
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2.5 bg-[#111424]/60 border border-slate-800/80 rounded-xl text-slate-300 hover:text-white hover:border-slate-700 transition-all focus:outline-none"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full ring-2 ring-[#0A0C16]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar Trigger */}
            {user && (
              <button 
                onClick={() => navigate('/profile')}
                className="relative shrink-0 focus:outline-none ring-2 ring-transparent hover:ring-indigo-500/40 rounded-full transition-all"
              >
                <img 
                  src={user.avatarUrl} 
                  alt={user.fullName} 
                  className="w-9 h-9 rounded-full object-cover border border-slate-700"
                />
              </button>
            )}
          </div>
        </header>

        {/* Page Content viewport */}
        <div className="flex-1 p-8">
          <Outlet context={{ onRefreshNotifications: handleRefreshUnread }} />
        </div>
      </main>

      {/* Slide-out Activity Drawer */}
      <NotificationsDrawer 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)}
        onRefreshNotifications={handleRefreshUnread}
      />
    </div>
  );
}
