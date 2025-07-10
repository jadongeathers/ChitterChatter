// utils/api.ts

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? '' : (import.meta.env.VITE_API_URL || '');

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  let fullUrl;
  if (endpoint.startsWith('/api/')) {
    const baseWithoutTrailingApi = API_BASE_URL.endsWith('/api') 
      ? API_BASE_URL.substring(0, API_BASE_URL.length - 4) 
      : API_BASE_URL;
    fullUrl = `${baseWithoutTrailingApi}${endpoint}`;
  } else {
    fullUrl = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }
  
  // Make the initial request
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Check if the response status is 401 (Unauthorized). This means the token is
  // expired or invalid.
  if (response.status === 401) {
    // Clear all authentication-related items from localStorage.
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user');
    localStorage.removeItem('instructor_selected_class');
    localStorage.removeItem('student_selected_class');

    // Force a redirect to the login page.
    window.location.href = '/login';
    throw new Error("Session expired. Redirecting to login.");
  }
  return response;
};