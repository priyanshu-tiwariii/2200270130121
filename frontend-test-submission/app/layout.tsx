'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { User } from '@/types';

// Custom Material UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Custom logging middleware
const customLogger = {
  logPageView: (page: string, meta: Record<string, unknown> = {}) => {
    console.log(`[${new Date().toISOString()}] Page View: ${page}`, meta);
  },
  logUserAction: (action: string, meta: Record<string, unknown> = {}) => {
    console.log(`[${new Date().toISOString()}] User Action: ${action}`, meta);
  },
  logAPICall: (method: string, url: string, data?: unknown, response?: unknown) => {
    console.log(`[${new Date().toISOString()}] API Call: ${method} ${url}`, { data, response });
  },
  logError: (error: unknown, context: Record<string, unknown> = {}) => {
    console.error(`[${new Date().toISOString()}] Error:`, error, context);
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (authToken: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  logger: typeof customLogger;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Authentication Provider
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const savedToken = Cookies.get('authToken');
    const savedUser = Cookies.get('authUser');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        customLogger.logUserAction('App Initialized - User Already Logged In', {
          user: JSON.parse(savedUser).email
        });
      } catch (error) {
        customLogger.logError('Failed to parse saved user data', { error });
        Cookies.remove('authToken');
        Cookies.remove('authUser');
      }
    } else {
      customLogger.logUserAction('App Initialized - No Existing Session');
    }
    
    setLoading(false);
  }, []);

  const login = (authToken: string, userData: User) => {
    setToken(authToken);
    setUser(userData);
    
    Cookies.set('authToken', authToken, { expires: 1 });
    Cookies.set('authUser', JSON.stringify(userData), { expires: 1 });
    
    customLogger.logUserAction('User Logged In', {
      email: userData.email,
      rollNumber: userData.rollNumber
    });
  };

  const logout = () => {
    if (user) {
      customLogger.logUserAction('User Logged Out', {
        email: user.email
      });
    }
    
    setToken(null);
    setUser(null);
    
    Cookies.remove('authToken');
    Cookies.remove('authUser');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    logger: customLogger
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


declare global {
  interface Window {
    customLogger: typeof customLogger;
    logPageView: typeof customLogger.logPageView;
    logUserAction: typeof customLogger.logUserAction;
    logAPICall: typeof customLogger.logAPICall;
    logError: typeof customLogger.logError;
  }
}


const setupGlobalLogging = () => {
  if (typeof window !== 'undefined') {
    // Make logging functions available globally
    window.customLogger = customLogger;
    window.logPageView = customLogger.logPageView;
    window.logUserAction = customLogger.logUserAction;
    window.logAPICall = customLogger.logAPICall;
    window.logError = customLogger.logError;
    
    // Log unhandled errors
    window.addEventListener('error', (event) => {
      customLogger.logError('Unhandled Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
    
    // Log unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      customLogger.logError('Unhandled Promise Rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });
  }
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    setupGlobalLogging();
  }, []);

  return (
    <html lang="en">
      <head>
        <title>URL Shortener Application</title>
        <meta name="description" content="URL Shortener Application with Authentication" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}