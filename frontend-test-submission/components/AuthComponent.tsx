'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  VpnKey as TokenIcon
} from '@mui/icons-material';
import { authApi } from '@/utils/api';
import { useAuth } from '@/app/layout';
import { RegisterData, LoginData } from '@/types';

const AuthComponent = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, logger } = useAuth();

  // Registration form state
  const [regData, setRegData] = useState<RegisterData>({
    email: '',
    name: '',
    rollNumber: '',
    githubUsername: ''
  });

  // Login form state
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    rollNumber: '',
    clientId: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    logger.logUserAction('Registration Attempt', {
      email: regData.email,
      rollNumber: regData.rollNumber
    });

    try {
      const result = await authApi.register(regData);
      
      if (result.success) {
        setSuccess('Registration successful! You can now login with your credentials.');
        setLoginData(prev => ({
          ...prev,
          email: regData.email,
          clientId: result.data?.clientId || ''
        }));
        setCurrentTab(1); // Switch to login tab
        
        logger.logUserAction('Registration Successful', {
          email: regData.email,
          rollNumber: regData.rollNumber
        });
      } else {
        setError(result.error || 'Registration failed');
        logger.logError('Registration Failed', { error: result.error });
      }
    } catch (err: unknown) {
      setError('Registration failed. Please try again.');
      if (err instanceof Error) {
        logger.logError('Registration Error', { error: err.message });
      } else {
        logger.logError('Registration Error', { error: String(err) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    logger.logUserAction('Login Attempt', {
      email: loginData.email,
      rollNumber: loginData.rollNumber
    });

    try {
      const result = await authApi.getToken(loginData);
      
      if (result.success) {
        // Store token and user data
        login(result.data!.access_token, {
          email: loginData.email,
          rollNumber: loginData.rollNumber,
          clientId: loginData.clientId
        });
        
        setSuccess('Login successful! You can now use the application.');
        logger.logUserAction('Login Successful', {
          email: loginData.email,
          rollNumber: loginData.rollNumber
        });
      }
    } catch (err: unknown) {
      setError('Login failed. Please try again.');
      if (err instanceof Error) {
        logger.logError('Login Error', { error: err.message });
      } else {
        logger.logError('Login Error', { error: String(err) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setError('');
    setSuccess('');
    
    logger.logUserAction('Auth Tab Changed', {
      from: currentTab,
      to: newValue
    });
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Authentication Required
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Please register or login to use the URL shortener application
          </Typography>

          <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<RegisterIcon />} label="Register" />
            <Tab icon={<LoginIcon />} label="Login" />
          </Tabs>

          <Divider sx={{ my: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Registration Form */}
          {currentTab === 0 && (
            <Box component="form" onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={regData.email}
                onChange={(e) => setRegData(prev => ({ ...prev, email: e.target.value }))}
                required
                sx={{ mb: 2 }}
                placeholder="your.email@university.edu"
              />
              
              <TextField
                fullWidth
                label="Full Name"
                value={regData.name}
                onChange={(e) => setRegData(prev => ({ ...prev, name: e.target.value }))}
                required
                sx={{ mb: 2 }}
                placeholder="Your Full Name"
              />
              
              <TextField
                fullWidth
                label="Roll Number"
                value={regData.rollNumber}
                onChange={(e) => setRegData(prev => ({ ...prev, rollNumber: e.target.value }))}
                required
                sx={{ mb: 2 }}
                placeholder="2021CS001"
              />
              
              <TextField
                fullWidth
                label="GitHub Username"
                value={regData.githubUsername}
                onChange={(e) => setRegData(prev => ({ ...prev, githubUsername: e.target.value }))}
                required
                sx={{ mb: 3 }}
                placeholder="your-github-username"
              />
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RegisterIcon />}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </Box>
          )}

          {/* Login Form */}
          {currentTab === 1 && (
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                required
                sx={{ mb: 2 }}
                placeholder="your.email@university.edu"
              />
              
              <TextField
                fullWidth
                label="Roll Number"
                value={loginData.rollNumber}
                onChange={(e) => setLoginData(prev => ({ ...prev, rollNumber: e.target.value }))}
                required
                sx={{ mb: 2 }}
                placeholder="2021CS001"
              />
              
              <TextField
                fullWidth
                label="Client ID"
                value={loginData.clientId}
                onChange={(e) => setLoginData(prev => ({ ...prev, clientId: e.target.value }))}
                required
                sx={{ mb: 3 }}
                placeholder="Client ID from registration"
                helperText="Use the Client ID you received after registration"
              />
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <TokenIcon />}
              >
                {loading ? 'Logging in...' : 'Get Access Token & Login'}
              </Button>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 2 }}>
            This application requires authentication as per evaluation guidelines
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthComponent;