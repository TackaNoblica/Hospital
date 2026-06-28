// src/api/client.js  -  novi fajl
import axios from 'axios';

// VAZNO: isti port kao server.port u application.properties (8081)
export const API_BASE_URL = 'http://localhost:8081';

const client = axios.create({ baseURL: API_BASE_URL });

// Na svaki zahtev automatski zakaci token ako postoji
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('careafterToken');
  // Debug: log token presence and requested URL
  try {
    // eslint-disable-next-line no-console
    console.debug('API request:', config.method?.toUpperCase(), config.url, 'tokenPresent=', !!token);
  } catch (e) {}
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Ako token istekne ili nije validan -> vrati na login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('careafterToken');
      localStorage.removeItem('careafterRole');
      if (window.location.pathname !== '/') window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default client;
