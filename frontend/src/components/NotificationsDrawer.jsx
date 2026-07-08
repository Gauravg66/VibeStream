import React, { useEffect, useState } from 'react';
import { X, Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function NotificationsDrawer({ isOpen, onClose, onRefreshNotifications }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications whenever drawer is opened
  useEffect(() => {
    if (isOpen && token) {
      fetchNotifications();
    }
  }, [isOpen, token]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token || notifications.length === 0) return;
    try {
      const res = await fetch(`${API_URL}/notifications/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        if (onRefreshNotifications) {
          onRefreshNotifications();
        }
      }
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="w-full max-w-md h-full glass-panel relative z-10 shadow-2xl flex flex-col border-l border-slate-800 text-white animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold tracking-wide">Activity Logs</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 bg-[#111424]/40 border-b border-slate-800/60 flex justify-end">
            <button 
              onClick={handleMarkAllRead} 
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Bell className="w-12 h-12 stroke-[1.2]" />
              <p className="text-sm font-medium">No activity notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`p-4 rounded-xl border transition-all ${
                  notif.isRead 
                    ? 'bg-[#111424]/30 border-slate-800/40 text-slate-400' 
                    : 'bg-[#111424]/90 border-indigo-500/20 text-white shadow-md shadow-indigo-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    notif.isRead ? 'bg-slate-800/40 text-slate-500' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
