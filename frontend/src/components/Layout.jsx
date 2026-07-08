import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import NotificationsDrawer from './NotificationsDrawer';

const API_URL = 'http://localhost:5000/api';

export default function Layout() {
  const { isAuthenticated, loading, token } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for notifications unread count
  useEffect(() => {
    if (!token) return;
    
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
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
    
    // Poll every 15 seconds
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleRefreshUnread = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
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

  // Redirect to login if user is not authenticated
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
