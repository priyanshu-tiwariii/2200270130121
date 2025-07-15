 export interface User {
  email: string;
  rollNumber: string;
  clientId: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterData {
  email: string;
  name: string;
  rollNumber: string;
  githubUsername: string;
}

export interface LoginData {
  email: string;
  rollNumber: string;
  clientId: string;
}

export interface UrlData {
  url: string;
  validity?: number;
  shortcode?: string;
}

export interface ShortUrl {
  id: number;
  originalUrl: string;
  shortLink: string;
  expiry: string;
  validity: number;
  createdAt: string;
  createdBy?: string;
}

export interface UrlStatistics {
  shortcode: string;
  originalUrl: string;
  shortLink: string;
  createdAt: string;
  expiry: string;
  validityMinutes: number;
  totalClicks: number;
  isActive: boolean;
  createdBy?: {
    email: string;
    rollNumber: string;
  };
  clickData: ClickData[];
}

export interface ClickData {
  timestamp: string;
  source: string;
  userAgent?: string;
  location: string;
  ip?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}