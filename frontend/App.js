import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { isDark } = useTheme();
  return (
    <AlertProvider>
      <AuthProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <AppNavigator />
        </KeyboardAvoidingView>
      </AuthProvider>
    </AlertProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
