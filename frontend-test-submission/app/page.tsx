'use client';

import { useEffect } from 'react';
import Layout from '@/components/Layout';
import UrlShortener from '@/components/UrlShortener';
import AuthComponent from '@/components/AuthComponent';
import { useAuth } from './layout';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function Home() {
  const { isAuthenticated, loading, logger } = useAuth();

  useEffect(() => {
    if (logger) {
      logger.logPageView('Home Page', {
        authenticated: isAuthenticated,
        timestamp: new Date().toISOString()
      });
    }
  }, [isAuthenticated, logger]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading Application...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <AuthComponent />
      </Layout>
    );
  }

  return (
    <Layout>
      <UrlShortener />
    </Layout>
  );
}