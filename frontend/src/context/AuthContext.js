import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, authStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(authStorage.key)
      .then((raw) => {
        if (raw) {
          setSession(JSON.parse(raw));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function persist(nextSession) {
    setSession(nextSession);
    if (nextSession) {
      await AsyncStorage.setItem(authStorage.key, JSON.stringify(nextSession));
    } else {
      await AsyncStorage.removeItem(authStorage.key);
    }
  }

  async function login(email, password) {
    const data = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await persist(data);
    return data;
  }

  async function register(payload) {
    const data = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: payload,
    });
    await persist(data);
    return data;
  }

  async function logout() {
    await persist(null);
  }

  async function request(path, options = {}) {
    if (!session?.token) {
      throw new Error('Not authenticated');
    }
    return apiRequest(path, { ...options, token: session.token });
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      login,
      register,
      logout,
      request,
      setSession: persist,
      familyId: session?.familyId,
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
