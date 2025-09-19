import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAgwEthersAndService } from '../hooks/useAgwEthersAndService';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const { account, contractService, hasProfile } = useAgwEthersAndService();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load profile data when account or contractService changes
  useEffect(() => {
    const loadProfileData = async () => {
      if (!account || !contractService || !hasProfile) {
        setProfileData(null);
        return;
      }

      setIsLoading(true);
      try {
        // Load profile information and username
        const [profile, username] = await Promise.all([
          contractService.getProfile(account),
          contractService.getUsername(account)
        ]);
        
        // Add username to profile data
        const profileWithUsername = {
          ...profile,
          username: username || "Player"
        };
        setProfileData(profileWithUsername);

        setLastUpdated(Date.now());
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [account, contractService, hasProfile]);

  // Function to refresh profile data
  const refreshProfileData = async () => {
    if (!account || !contractService) return;

    setIsLoading(true);
    try {
      const [profile, username] = await Promise.all([
        contractService.getProfile(account),
        contractService.getUsername(account)
      ]);
      
      // Add username to profile data
      const profileWithUsername = {
        ...profile,
        username: username || "Player"
      };
      
      setProfileData(profileWithUsername);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Failed to refresh profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear profile data (useful for logout)
  const clearProfileData = () => {
    setProfileData(null);
    setLastUpdated(null);
  };

  const value = {
    profileData,
    isLoading,
    lastUpdated,
    refreshProfileData,
    clearProfileData,
    hasProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
