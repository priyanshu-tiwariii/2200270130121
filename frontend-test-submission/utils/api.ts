import axios from 'axios';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { 
  User, 
  AuthResponse, 
  RegisterData, 
  LoginData, 
  UrlData, 
  UrlStatistics, 
  ApiResponse 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication and logging
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const timestamp = new Date().toISOString();
    
    // Add authentication token if available
    const token = Cookies.get('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API request (mandatory logging integration)
    if (typeof window !== 'undefined' && (window as any).customLogger) {
      (window as any).customLogger.logAPICall(
        config.method?.toUpperCase(),
        config.url,
        config.data
      );
    }
    
    console.log(`[${timestamp}] API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
      hasAuth: !!token
    });
    
    return config;
  },
  (error) => {
    if (typeof window !== 'undefined' && (window as any).customLogger) {
      (window as any).customLogger.logError('API Request Error', { error: error.message });
    }
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const timestamp = new Date().toISOString();
    
    // Log API response
    if (typeof window !== 'undefined' && (window as any).customLogger) {
      (window as any).customLogger.logAPICall(
        response.config.method?.toUpperCase(),
        response.config.url,
        response.config.data,
        response.data
      );
    }
    
    console.log(`[${timestamp}] API Response: ${response.status} ${response.config.url}`, {
      data: response.data,
      status: response.status
    });
    
    return response;
  },
  (error) => {
    const timestamp = new Date().toISOString();
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear invalid token
      Cookies.remove('authToken');
      Cookies.remove('authUser');
      
      if (typeof window !== 'undefined' && (window as any).customLogger) {
        (window as any).customLogger.logError('Authentication Error', {
          status: error.response.status,
          message: error.response.data?.message
        });
      }
    }
    
    if (typeof window !== 'undefined' && (window as any).customLogger) {
      (window as any).customLogger.logError('API Response Error', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      });
    }
    
    console.error(`[${timestamp}] API Error:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
    
    return Promise.reject(error);
  }
);

// Authentication API functions
export const authApi = {
  // Register user
  register: async (userData: RegisterData): Promise<ApiResponse<{ clientId: string }>> => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      let errorMessage = 'Registration failed';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        errorMessage = (error.response as { data: { message?: string } }).data?.message || errorMessage;
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Get authentication token
  getToken: async (credentials: LoginData): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await api.post('/auth/token', credentials);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Token generation failed'
      };
    }
  },

  // Verify token
  verifyToken: async (): Promise<ApiResponse<{ valid: boolean; user: User }>> => {
    try {
      const response = await api.get('/auth/verify');
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Token verification failed'
      };
    }
  }
};

// URL API functions (requires authentication)
export const urlApi = {
  // Create short URL
  createShortUrl: async (urlData: UrlData): Promise<ApiResponse<{ shortLink: string; expiry: string }>> => {
    try {
      const response = await api.post('/shorturls', urlData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      let errorMessage = 'Failed to create short URL';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        errorMessage = (error.response as { data: { message?: string } }).data?.message || errorMessage;
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Get URL statistics
  getUrlStatistics: async (shortcode: string): Promise<ApiResponse<UrlStatistics>> => {
    try {
      const response = await api.get(`/shorturls/${shortcode}`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      let errorMessage = 'Failed to get URL statistics';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        errorMessage = (error.response as { data: { message?: string } }).data?.message || errorMessage;
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Get all URLs
  getAllUrls: async (): Promise<ApiResponse<{ totalUrls: number; urls: UrlStatistics[] }>> => {
    try {
      const response = await api.get('/shorturls');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      let errorMessage = 'Failed to get URLs';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        errorMessage = (error.response as { data: { message?: string } }).data?.message || errorMessage;
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

// General API functions
export const generalApi = {
  // Test backend connection
  healthCheck: async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    try {
      const response = await api.get('/health');
      return { success: true, data: response.data };
    } catch {
      return {
        success: false,
        error: 'Backend connection failed'
      };
    }
  }
};

export default api;