import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../constants/theme';

const ThemeContext = createContext(null);
const THEME_KEY = 'frap_theme_preference';

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState('dark'); // Default to dark theme

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setThemeMode(saved);
      }
    });
  }, []);

  const colors = useMemo(() => {
    return themeMode === 'dark' ? darkColors : lightColors;
  }, [themeMode]);

  const toggleTheme = async () => {
    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
    await AsyncStorage.setItem(THEME_KEY, nextMode);
  };

  const value = useMemo(() => ({
    themeMode,
    isDark: themeMode === 'dark',
    colors,
    toggleTheme,
  }), [themeMode, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
