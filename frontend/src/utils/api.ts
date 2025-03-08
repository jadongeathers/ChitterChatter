// utils/api.ts
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  // Ensure endpoint starts with / if it doesn't already
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Remove /api prefix if it's already included in the endpoint
  const cleanEndpoint = normalizedEndpoint.startsWith('/api/') 
    ? normalizedEndpoint.substring(4) 
    : normalizedEndpoint;
  
  return fetch(`${API_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });
};