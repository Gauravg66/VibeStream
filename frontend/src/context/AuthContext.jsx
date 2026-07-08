import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('stream_session_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchLaterCount, setWatchLaterCount] = useState(0);

  // Fetch user profile on startup if token is cached
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setWatchLaterCount(data.user.watchLater?.length || 0);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  // Request OTP from Clerk/Mock backend
  const sendOtp = async (email) => {
    const res = await fetch(`${API_URL}/auth/mock-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to dispatch OTP');
    return data;
  };

  // Verify OTP and capture session token
  const verifyOtp = async (email, otp) => {
    const res = await fetch(`${API_URL}/auth/mock-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');

    // Cache session token
    localStorage.setItem('stream_session_token', data.token);
    setToken(data.token);

    if (data.userExists && data.user) {
      setUser(data.user);
      setWatchLaterCount(data.user.watchLater?.length || 0);
    }

    return {
      userExists: data.userExists,
      clerkId: data.clerkId,
      email: data.email
    };
  };

  // Sync user register form data to MongoDB Compass
  const registerUser = async (fullName, email, clerkId) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fullName, email, clerkId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sync registration');

    setUser(data.user);
    setWatchLaterCount(data.user.watchLater?.length || 0);
    return data.user;
  };

  // Update profile details
  const updateProfile = async (fullName, avatarUrl) => {
    if (!token) return;
    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fullName, avatarUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    setUser(data.user);
    return data.user;
  };

  // Toggle watch-later video state
  const toggleWatchLater = async (videoId) => {
    if (!token) return false;
    try {
      const res = await fetch(`${API_URL}/videos/${videoId}/watch-later`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setWatchLaterCount(data.watchLaterCount);
        
        // Update local user watchLater array
        if (user) {
          const updatedWatchLater = [...user.watchLater];
          const idx = updatedWatchLater.indexOf(videoId);
          if (idx > -1) {
            updatedWatchLater.splice(idx, 1);
          } else {
            updatedWatchLater.push(videoId);
          }
          setUser({ ...user, watchLater: updatedWatchLater });
        }
        return data.isPinned;
      }
    } catch (err) {
      console.error('Error toggling watch later:', err);
    }
    return false;
  };

  // Sign out method
  const logout = () => {
    localStorage.removeItem('stream_session_token');
    setToken(null);
    setUser(null);
    setWatchLaterCount(0);
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      isAuthenticated: !!token && !!user,
      watchLaterCount,
      sendOtp,
      verifyOtp,
      registerUser,
      updateProfile,
      toggleWatchLater,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
