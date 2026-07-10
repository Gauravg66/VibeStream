import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, User, Mail, ShieldCheck, LogOut, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [channelName, setChannelName] = useState(user?.channelName || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Preset avatar arrays for high-fidelity interactive customization
  const presetAvatars = [
    { name: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
    { name: 'Aria', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
    { name: 'Leo', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo' },
    { name: 'Maya', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya' },
    { name: 'Kira', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kira' },
    { name: 'Jasper', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper' },
    { name: 'Nala', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nala' },
    { name: 'Zane', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zane' }
  ];

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full Name cannot be empty');
      return;
    }
    if (user?.isCreator && !channelName.trim()) {
      setError('Channel Name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile(fullName, avatarUrl, user?.isCreator ? channelName : null);
      setSuccess('Profile ledger updated successfully in MongoDB Compass!');
      
      // Clear toast after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update user profile');
    } finally {
      setLoading(false);
    }
  };

  const selectAvatar = (url) => {
    setAvatarUrl(url);
    setIsAvatarModalOpen(false);
  };

  const handleLogout = () => {
    // Triggers programmatic sign-out method through Clerk/Mock and hard redirects to Login
    logout();
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      
      {/* Header Profile Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">My Account</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Configure your personal information ledger settings</p>
      </div>

      {/* Hero Header Profile Card */}
      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Profile Avatar Stack */}
        <div className="px-8 pb-6 relative flex flex-col items-center sm:items-start sm:flex-row gap-5 -mt-12">
          
          {/* Avatar frame */}
          <div className="relative group shrink-0">
            <img 
              src={avatarUrl} 
              alt={fullName} 
              className="w-24 h-24 rounded-full object-cover border-4 border-[#0A0C16] bg-slate-900 shadow-2xl transition-all"
            />
            {/* Camera Overlay Badge */}
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 border-2 border-[#0A0C16] text-white hover:bg-indigo-500 hover:scale-105 transition-all focus:outline-none"
              title="Change Profile Picture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center sm:text-left pt-14 sm:pt-12 flex-1">
            <h2 className="text-xl font-bold text-white tracking-wide">{user.fullName}</h2>
            {user.isCreator && (
              <p className="text-sm font-semibold text-indigo-400 mt-0.5">Channel: {user.channelName}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Form Details */}
      <div className="glass-panel border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">User Details Ledger</h3>

        {/* Status Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2.5 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Editable Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            {/* Read-only Email ID */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email ID (Read-only)</label>
              <div className="relative opacity-65">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  disabled
                  className="w-full bg-[#111424] border border-slate-855 rounded-xl py-3 pl-11 pr-4 text-slate-400 text-sm cursor-not-allowed font-medium"
                  value={user.email}
                />
              </div>
            </div>

            {/* Editable Channel Name (Only for Creators) */}
            {user?.isCreator && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Channel Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="My Custom Channel Name"
                    maxLength={50}
                    className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Action Grid Tray */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-900 mt-8">
            <button
              type="button"
              onClick={handleLogout}
              className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Ledger...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Preset Avatars Selection Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAvatarModalOpen(false)} />
          <div className="glass-panel w-full max-w-lg rounded-2xl relative z-10 shadow-2xl border border-slate-800 text-white p-6 max-h-[90vh] flex flex-col">
            <div className="pb-4 border-b border-slate-900">
              <h3 className="text-base font-bold tracking-wide">Select Custom Avatar</h3>
              <p className="text-xs text-slate-500 mt-1">Pick a digital identity template for your profile card</p>
            </div>
            <div className="grid grid-cols-4 gap-4 py-6 overflow-y-auto">
              {presetAvatars.map((av) => (
                <button
                  key={av.name}
                  onClick={() => selectAvatar(av.url)}
                  className={`p-2.5 rounded-xl bg-[#111424]/40 border transition-all flex flex-col items-center gap-2 hover:border-indigo-500/40 hover:bg-[#111424] ${
                    avatarUrl === av.url ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/30' : 'border-slate-800'
                  }`}
                >
                  <img src={av.url} alt={av.name} className="w-12 h-12 rounded-full object-cover" />
                  <span className="text-[10px] font-semibold text-slate-400">{av.name}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-900">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
