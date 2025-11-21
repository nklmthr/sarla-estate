import axios, { AxiosRequestConfig, AxiosError } from 'axios';

// Use relative path when served from Spring Boot, or localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Global error handler (will be set by ErrorProvider)
let globalErrorHandler: ((statusCode: number, message?: string, technicalDetails?: string) => void) | null = null;
let globalNetworkErrorHandler: (() => void) | null = null;

export const setGlobalErrorHandler = (
  httpErrorHandler: (statusCode: number, message?: string, technicalDetails?: string) => void,
  networkErrorHandler: () => void
) => {
  globalErrorHandler = httpErrorHandler;
  globalNetworkErrorHandler = networkErrorHandler;
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and extracting data
axiosInstance.interceptors.response.use(
  (response) => response.data, // Extract data from response
  (error: AxiosError) => {
    // Check if this error should be silently handled (config has silentError flag)
    const config = error.config as any;
    const silentError = config?.silentError === true;
    
    // Handle network errors (server not reachable)
    if (!error.response) {
      if (!silentError && globalNetworkErrorHandler) {
        globalNetworkErrorHandler();
      } else if (!silentError) {
        console.error('Network error:', error.message);
      }
      return Promise.reject(error);
    }

    // Handle HTTP errors
    const statusCode = error.response.status;
    const errorData = error.response.data as any;
    const errorMessage = errorData?.message || errorData?.error || error.message;
    
    // Build technical details
    const technicalDetails = JSON.stringify({
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: statusCode,
      statusText: error.response.statusText,
      data: errorData,
      timestamp: new Date().toISOString(),
    }, null, 2);

    // Show error dialog if handler is set (unless silent)
    if (!silentError && globalErrorHandler) {
      globalErrorHandler(statusCode, errorMessage, technicalDetails);
    } else if (!silentError) {
      console.error(`HTTP ${statusCode} error:`, errorMessage);
    }

    // Special handling for 401 - redirect to login (even if silent)
    if (statusCode === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Create a typed wrapper that returns data directly
const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get(url, config);
  },
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.post(url, data, config);
  },
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.put(url, data, config);
  },
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete(url, config);
  },
};

export default apiClient;

