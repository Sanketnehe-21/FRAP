import Constants from 'expo-constants';

const AUTH_KEY = 'frap_auth';

export function getApiUrl() {
  return Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:8080';
}

export async function apiRequest(path, { method = 'GET', token, body, formData } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body && !formData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || data.message || 'Request failed';
    throw new Error(message);
  }

  return data;
}

export const authStorage = {
  key: AUTH_KEY,
};
