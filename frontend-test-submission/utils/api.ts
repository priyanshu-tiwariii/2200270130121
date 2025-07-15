// src/lib/api.ts
import axios from 'axios';
import type {
  AxiosResponse,
  AxiosRequestConfig,
  AxiosError
} from 'axios';

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

// ——————————————————————————————————————————
// helpers
// ——————————————————————————————————————————
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

/** Extracts a readable message from an Axios error */
function getAxiosMessage(
  err: AxiosError<{ message?: string }>
): string {
  return (
    err.response?.data?.message ||
    err.message ||
    'Unknown Axios error'
  );
}

function logFrontend(type: 'info' | 'error', message: string, meta?: any) {
  if (typeof window !== 'undefined' && (window as any).customLogger) {
    const logger = (window as any).customLogger;
    if (type === 'info') logger.logAPICall?.(meta?.method, meta?.url, meta?.requestData, meta?.responseData);
    if (type === 'error') logger.logError?.(message, meta);
  }
}


const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
});

// request
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const ts = new Date().toISOString();
    const token = Cookies.get('authToken');

    if (token) {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    }

    console.log(
      `[${ts}] → ${config.method?.toUpperCase()} ${config.url}`,
      { data: config.data, params: config.params, hasAuth: !!token }
    );

    logFrontend('info', '', {
      method: config.method?.toUpperCase(),
      url: config.url,
      requestData: config.data
    });

    return config;
  },
  err => Promise.reject(err)
);

// response
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const ts = new Date().toISOString();

    console.log(
      `[${ts}] ← ${response.status} ${response.config.url}`,
      { data: response.data }
    );

    logFrontend('info', '', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      requestData: response.config.data,
      responseData: response.data
    });

    return response;
  },
  (err: AxiosError) => {
    const ts = new Date().toISOString();
    const status = err.response?.status;

    // 401 ⇒ wipe tokens
    if (status === 401) {
      Cookies.remove('authToken');
      Cookies.remove('authUser');
    }

    console.error(
      `[${ts}] ERROR ${status ?? ''} ${err.config?.url} –`,
      getAxiosMessage(err)
    );

    logFrontend('error', getAxiosMessage(err), {
      status,
      url: err.config?.url
    });

    return Promise.reject(err);
  }
);

// ——————————————————————————————————————————
// API sections
// ——————————————————————————————————————————
export const authApi = {
  /** POST /auth/register */
  async register(
    userData: RegisterData
  ): Promise<ApiResponse<{ clientId: string }>> {
    try {
      const { data } = await api.post<
        { clientId: string },
        AxiosResponse<{ clientId: string }>,
        RegisterData
      >('/auth/register', userData);

      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: getAxiosMessage(e as AxiosError)
      };
    }
  },

  /** POST /auth/token */
  async getToken(
    credentials: LoginData
  ): Promise<ApiResponse<AuthResponse>> {
    try {
      const { data } = await api.post<
        AuthResponse,
        AxiosResponse<AuthResponse>,
        LoginData
      >('/auth/token', credentials);

      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: getAxiosMessage(e as AxiosError)
      };
    }
  },

  /** GET /auth/verify */
  async verifyToken(): Promise<
    ApiResponse<{ valid: boolean; user: User }>
  > {
    try {
      const { data } = await api.get<
        { valid: boolean; user: User }
      >('/auth/verify');

      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: getAxiosMessage(e as AxiosError)
      };
    }
  }
};

export const urlApi = {
  /** POST /shorturls */
  async createShortUrl(
    urlData: UrlData
  ): Promise<ApiResponse<{ shortLink: string; expiry: string }>> {
    try {
      const { data } = await api.post<
        { shortLink: string; expiry: string },
        AxiosResponse<{ shortLink: string; expiry: string }>,
        UrlData
      >('/shorturls', urlData);

      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: getAxiosMessage(e as AxiosError)
      };
    }
  },

  /** GET /shorturls/:shortcode */
  async getUrlStatistics(
    shortcode: string
  ): Promise<ApiResponse<UrlStatistics>> {
    try {
      const { data } = await api.get<UrlStatistics>(
        `/shorturls/${shortcode}`
      );

      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: getAxiosMessage(e as AxiosError)
      };
    }
  },

  /** GET /shorturls */
  async getAllUrls(): Promise<
    ApiResponse<{ totalUrls: number; urls: UrlStatistics[] }>
  > {
    try {
      const { data } = await api.get<{
        totalUrls: number;
        urls: UrlStatistics[];
      }>('/shorturls');

      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: getAxiosMessage(e as AxiosError)
      };
    }
  }
};

export const generalApi = {
  /** GET /health */
  async healthCheck(): Promise<
    ApiResponse<{ status: string; timestamp: string }>
  > {
    try {
      const { data } = await api.get<{
        status: string;
        timestamp: string;
      }>('/health');

      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: getAxiosMessage(e as AxiosError)
      };
    }
  }
};

export default api;
