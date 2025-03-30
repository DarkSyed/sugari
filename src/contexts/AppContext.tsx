import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Theme } from '../types';
import { getUserSettings, updateUserSettings } from '../services/database';
import { lightTheme, darkTheme } from '../constants/theme';

interface AppContextType {
  isLoading: boolean;
  userSettings: UserSettings | null;
  theme: Theme;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [theme, setTheme] = useState<Theme>(lightTheme);

  // Load user settings from the database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await getUserSettings();
        setUserSettings(settings);
        
        // Set theme based on dark mode setting
        if (settings.darkMode) {
          setTheme(darkTheme);
        } else {
          setTheme(lightTheme);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
        // Use default settings if there was an error
        setUserSettings({
          id: 1,
          email: null,
          firstName: null,
          lastName: null,
          diabetesType: null,
          notifications: true,
          darkMode: false,
          units: 'mg/dL'
        });
        setTheme(lightTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle updating user settings
  const handleUpdateSettings = async (settings: Partial<UserSettings>): Promise<void> => {
    try {
      setIsLoading(true);
      
      // If darkMode is being updated, update the theme
      if (settings.darkMode !== undefined) {
        setTheme(settings.darkMode ? darkTheme : lightTheme);
      }
      
      // Update local state
      setUserSettings(prev => {
        if (!prev) return null;
        return { ...prev, ...settings };
      });
      
      // Update the database
      await updateUserSettings(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isLoading,
    userSettings,
    theme,
    updateSettings: handleUpdateSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext; 