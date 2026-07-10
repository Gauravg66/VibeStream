import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useClerkAuth();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchLaterCount, setWatchLaterCount] = useState(0);

  // Sync / load profile when Clerk authentication state changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const sessionToken = await getToken();
        setToken(sessionToken);
        
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setWatchLaterCount(data.user.watchLaterUnreadCount || 0);
        } else {
          // If the profile fetch fails but Clerk is authenticated,
          // let user state remain null so that they can register/sync.
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isLoaded, isSignedIn, userId]);

  // Sync user register form data to MongoDB
  const registerUser = async (fullName, email, clerkId) => {
    const sessionToken = await getToken();
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ fullName, email, clerkId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sync registration');

    setUser(data.user);
    setWatchLaterCount(data.user.watchLaterUnreadCount || 0);
    return data.user;
  };

  // Update profile details
  const updateProfile = async (fullName, avatarUrl, channelName = null) => {
    if (!isSignedIn) return;
    const sessionToken = await getToken();
    const bodyObj = { fullName, avatarUrl };
    if (channelName !== null) {
      bodyObj.channelName = channelName;
    }
    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify(bodyObj)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    setUser(data.user);
    return data.user;
  };

  // Toggle watch-later video state
  const toggleWatchLater = async (videoId) => {
    if (!isSignedIn) return false;
    try {
      const sessionToken = await getToken();
      const res = await fetch(`${API_URL}/videos/${videoId}/watch-later`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setWatchLaterCount(data.watchLaterCount);
        
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

  // Upgrade user to creator status
  const becomeCreator = async (channelName, channelDescription) => {
    if (!isSignedIn) return;
    const sessionToken = await getToken();
    const res = await fetch(`${API_URL}/users/profile/become-creator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ channelName, channelDescription })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to become creator');
    setUser(data.user);
    return data.user;
  };

  const getFreshToken = async () => {
    try {
      return await getToken();
    } catch (err) {
      console.error('Error getting fresh token:', err);
      return null;
    }
  };

  const clearWatchLaterBadge = () => {
    setWatchLaterCount(0);
  };

  // Sign out method
  const logout = async () => {
    await signOut();
    setToken(null);
    setUser(null);
    setWatchLaterCount(0);
  };

  return (
    <AuthContext.Provider value={{
      token,
      getFreshToken,
      user,
      loading,
      isAuthenticated: isSignedIn && !!user,
      watchLaterCount,
      clearWatchLaterBadge,
      registerUser,
      updateProfile,
      becomeCreator,
      toggleWatchLater,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
