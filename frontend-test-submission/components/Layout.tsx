'use client';

import { useState, useEffect, ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Chip
} from '@mui/material';
import {
  Link as LinkIcon,
  Analytics as AnalyticsIcon,
  HealthAndSafety as HealthIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/layout';
import { generalApi } from '@/utils/api';

interface LayoutProps {
  children: ReactNode;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const Layout = ({ children }: LayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, logger } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [notification, setNotification] = useState<NotificationState>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // Set current tab based on route
    if (pathname === '/') {
      setCurrentTab(0);
    } else if (pathname === '/statistics') {
      setCurrentTab(1);
    }

    // Log page view (mandatory logging)
    if (logger) {
      logger.logPageView(pathname, {
        authenticated: isAuthenticated,
        user: user?.email
      });
    }
  }, [pathname, isAuthenticated, user, logger]);

  useEffect(() => {
    // Check backend connection
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    const result = await generalApi.healthCheck();
    setBackendStatus(result.success ? 'connected' : 'disconnected');
    
    if (!result.success) {
      showNotification('Backend connection failed. Please ensure the backend is running on http://localhost:5000', 'error');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    
    // Log user action (mandatory logging)
    if (logger) {
      logger.logUserAction('Navigation Tab Changed', { 
        from: currentTab, 
        to: newValue,
        user: user?.email
      });
    }
    
    if (newValue === 0) {
      router.push('/');
    } else if (newValue === 1) {
      router.push('/statistics');
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    if (logger) {
      logger.logUserAction('User Logout', { user: user?.email });
    }
    
    logout();
    handleUserMenuClose();
    router.push('/');
  };

  const showNotification = (message: string, severity: NotificationState['severity'] = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const getStatusColor = (): 'success' | 'error' | 'warning' => {
    switch (backendStatus) {
      case 'connected': return 'success';
      case 'disconnected': return 'error';
      default: return 'warning';
    }
  };

  const getStatusText = (): string => {
    switch (backendStatus) {
      case 'connected': return 'Backend Connected';
      case 'disconnected': return 'Backend Disconnected';
      default: return 'Checking Backend...';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <LinkIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            URL Shortener
          </Typography>
          
          {/* Authentication Status */}
          {isAuthenticated && user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
              <Chip
                label={`${user.rollNumber}`}
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
              
              <Tooltip title="User Menu">
                <IconButton
                  color="inherit"
                  onClick={handleUserMenuOpen}
                  size="small"
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {user.email[0].toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          {/* Backend Status */}
          <Tooltip title={getStatusText()}>
            <IconButton color="inherit" size="small">
              <HealthIcon color={getStatusColor()} />
            </IconButton>
          </Tooltip>
        </Toolbar>
        
        {/* Navigation Tabs - Only show if authenticated */}
        {isAuthenticated && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.dark' }}>
            <Container maxWidth="lg">
              <Tabs 
                value={currentTab} 
                onChange={handleTabChange}
                textColor="inherit"
                indicatorColor="secondary"
              >
                <Tab 
                  icon={<LinkIcon />} 
                  label="URL Shortener" 
                  iconPosition="start"
                  sx={{ color: 'white' }}
                />
                <Tab 
                  icon={<AnalyticsIcon />} 
                  label="Statistics" 
                  iconPosition="start"
                  sx={{ color: 'white' }}
                />
              </Tabs>
            </Container>
          </Box>
        )}
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Roll: {user?.rollNumber}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          px: 2, 
          mt: 'auto',
          backgroundColor: 'grey.100',
          borderTop: '1px solid',
          borderColor: 'grey.300'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 URL Shortener Application - Campus Evaluation Submission
          </Typography>
          {isAuthenticated && (
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              Authenticated as: {user?.email} | Roll: {user?.rollNumber}
            </Typography>
          )}
        </Container>
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Layout;