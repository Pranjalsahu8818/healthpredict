// API Configuration for Railway deployment
export const API_BASE_URL = 'https://healthpredict-production.up.railway.app';

// Helper function to get API URL
export const getApiUrl = (endpoint: string = '') => {
  const baseUrl = API_BASE_URL;
  return endpoint ? `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}` : baseUrl;
};
