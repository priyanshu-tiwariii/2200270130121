'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  Analytics as AnalyticsIcon,
  AccessTime as TimeIcon,
  Mouse as MouseIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import moment from 'moment';
import { urlApi } from '@/utils/api';
import { useAuth } from '@/app/layout';
import { UrlStatistics } from '@/types';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const Statistics = () => {
  const { user, logger } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urls, setUrls] = useState<UrlStatistics[]>([]);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const [urlDetails, setUrlDetails] = useState<Record<string, UrlStatistics>>({});
  const [notification, setNotification] = useState<NotificationState>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });

  useEffect(() => {
    fetchAllUrls();
    
    // Log page view
    if (logger) {
      logger.logPageView('Statistics Page', {
        user: user?.email,
        timestamp: new Date().toISOString()
      });
    }
  }, [logger, user]);

  const fetchAllUrls = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await urlApi.getAllUrls();
      
      if (result.success) {
        setUrls(result.data?.urls || []);
        
        // Log user action
        if (logger) {
          logger.logUserAction('Fetch All URLs', { 
            count: result.data?.urls?.length || 0,
            user: user?.email
          });
        }
      } else {
        setError(result.error || 'Failed to fetch URLs');
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (err: unknown) {
      setError('Failed to fetch URLs');
      showNotification('Failed to fetch URLs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUrlDetails = async (shortcode: string) => {
    if (urlDetails[shortcode]) {
      return; // Already fetched
    }

    try {
      const result = await urlApi.getUrlStatistics(shortcode);
      
      if (result.success) {
        setUrlDetails(prev => ({
          ...prev,
          [shortcode]: result.data!
        }));
        
        // Log user action
        if (logger) {
          logger.logUserAction('Fetch URL Details', { 
            shortcode,
            totalClicks: result.data?.totalClicks,
            user: user?.email
          });
        }
      } else {
        showNotification(`Error fetching details: ${result.error}`, 'error');
      }
    } catch (err: unknown) {
      console.error('Failed to fetch URL details:', err);
      showNotification('Failed to fetch URL details', 'error');
    }
  };

  const handleAccordionChange = (shortcode: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedUrl(isExpanded ? shortcode : null);
    
    if (isExpanded) {
      fetchUrlDetails(shortcode);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Copied to clipboard!', 'success');
      if (logger) {
        logger.logUserAction('Copy to Clipboard', { text, user: user?.email });
      }
    });
  };

  const openUrl = (url: string) => {
    window.open(url, '_blank');
    if (logger) {
      logger.logUserAction('Open URL', { url, user: user?.email });
    }
  };

  const showNotification = (message: string, severity: NotificationState['severity'] = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const getStatusChip = (url: UrlStatistics) => {
    const isExpired = moment().isAfter(url.expiry);
    return (
      <Chip
        label={isExpired ? 'Expired' : 'Active'}
        size="small"
        color={isExpired ? 'error' : 'success'}
        variant={isExpired ? 'outlined' : 'filled'}
      />
    );
  };

  const getTotalClicks = (): number => {
    return urls.reduce((total, url) => total + (url.totalClicks || 0), 0);
  };

  const getActiveUrls = (): number => {
    return urls.filter(url => !moment().isAfter(url.expiry)).length;
  };

  const getExpiredUrls = (): number => {
    return urls.filter(url => moment().isAfter(url.expiry)).length;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading statistics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={fetchAllUrls}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary">
          URL Statistics
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAllUrls}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* User Info */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Chip
          icon={<PersonIcon />}
          label={`Analytics for: ${user?.email} (${user?.rollNumber})`}
          variant="outlined"
          color="primary"
        />
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AnalyticsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {urls.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total URLs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MouseIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="secondary">
                {getTotalClicks()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Clicks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimeIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success">
                {getActiveUrls()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active URLs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimeIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error">
                {getExpiredUrls()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expired URLs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* URLs List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Shortened URLs
          </Typography>

          {urls.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No URLs found. Create some URLs to see statistics here.
            </Typography>
          ) : (
            <Box>
              {urls.map((url) => (
                <Accordion
                  key={url.shortcode}
                  expanded={expandedUrl === url.shortcode}
                  onChange={handleAccordionChange(url.shortcode)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" color="primary">
                          {url.shortLink}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {url.originalUrl}
                        </Typography>
                        {url.createdBy && (
                          <Typography variant="caption" color="text.secondary">
                            Created by: {url.createdBy.email}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={`${url.totalClicks || 0} clicks`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {getStatusChip(url)}
                        
                        <Tooltip title="Copy short URL">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(url.shortLink);
                            }}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Open URL">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openUrl(url.shortLink);
                            }}
                          >
                            <LaunchIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    {urlDetails[url.shortcode] ? (
                      <Box>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Created:</strong> {moment(urlDetails[url.shortcode].createdAt).format('MMM DD, YYYY HH:mm')}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Expires:</strong> {moment(urlDetails[url.shortcode].expiry).format('MMM DD, YYYY HH:mm')}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Validity:</strong> {urlDetails[url.shortcode].validityMinutes} minutes
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Total Clicks:</strong> {urlDetails[url.shortcode].totalClicks}
                            </Typography>
                          </Grid>
                        </Grid>

                        {urlDetails[url.shortcode].clickData && urlDetails[url.shortcode].clickData.length > 0 ? (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Click History
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Timestamp</TableCell>
                                    <TableCell>Source</TableCell>
                                    <TableCell>Location</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {urlDetails[url.shortcode].clickData.slice(0, 10).map((click, index) => (
                                    <TableRow key={index}>
                                      <TableCell>
                                        {moment(click.timestamp).format('MMM DD, HH:mm:ss')}
                                      </TableCell>
                                      <TableCell>{click.source || 'Direct'}</TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <LocationIcon fontSize="small" />
                                          {click.location || 'Unknown'}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                            {urlDetails[url.shortcode].clickData.length > 10 && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Showing latest 10 clicks out of {urlDetails[url.shortcode].clickData.length} total
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                            No click data available yet
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Loading details...
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
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

export default Statistics;