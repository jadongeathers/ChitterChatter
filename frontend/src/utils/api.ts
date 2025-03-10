// utils/api.ts

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? '' : (import.meta.env.VITE_API_URL || '');

// const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  // Handle the case where endpoint includes /api and VITE_API_URL already ends with /api
  let fullUrl;
  if (endpoint.startsWith('/api/')) {
    // If your VITE_API_URL already ends with /api, avoid duplication
    const baseWithoutTrailingApi = API_BASE_URL.endsWith('/api') 
      ? API_BASE_URL.substring(0, API_BASE_URL.length - 4) 
      : API_BASE_URL;
    
    fullUrl = `${baseWithoutTrailingApi}${endpoint}`;
  } else {
    // For endpoints that don't start with /api
    fullUrl = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }
  
  return fetch(fullUrl, {
    ...options,
    headers,
  });
};