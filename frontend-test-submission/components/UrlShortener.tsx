'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon,
  ContentCopy as CopyIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import moment from 'moment';
import { urlApi } from '@/utils/api';
import { useAuth } from '@/app/layout';
import { UrlData, ShortUrl } from '@/types';

interface UrlForm {
  id: number;
  url: string;
  validity: number;
  shortcode: string;
  loading: boolean;
  error: string | null;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const UrlShortener = () => {
  const { user, logger } = useAuth();
  const [urls, setUrls] = useState<UrlForm[]>([
    { id: 1, url: '', validity: 30, shortcode: '', loading: false, error: null }
  ]);
  const [results, setResults] = useState<ShortUrl[]>([]);
  const [notification, setNotification] = useState<NotificationState>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });

  useEffect(() => {
    // Log component mount
    if (logger) {
      logger.logPageView('URL Shortener Component', {
        user: user?.email,
        totalForms: urls.length
      });
    }
  }, [logger, user, urls.length]);

  // Add new URL form (max 5 as per requirement)
  const addUrlForm = () => {
    if (urls.length >= 5) {
      showNotification('Maximum 5 URLs can be shortened concurrently', 'warning');
      return;
    }

    const newId = Math.max(...urls.map(u => u.id)) + 1;
    setUrls([...urls, { 
      id: newId, 
      url: '', 
      validity: 30, 
      shortcode: '', 
      loading: false, 
      error: null 
    }]);

    // Log user action
    if (logger) {
      logger.logUserAction('Add URL Form', { 
        totalForms: urls.length + 1,
        user: user?.email
      });
    }
  };

  // Remove URL form
  const removeUrlForm = (id: number) => {
    if (urls.length === 1) return; // Keep at least one form
    setUrls(urls.filter(u => u.id !== id));

    // Log user action
    if (logger) {
      logger.logUserAction('Remove URL Form', { 
        formId: id, 
        remainingForms: urls.length - 1,
        user: user?.email
      });
    }
  };

  // Update URL form data
  const updateUrl = (
    id: number,
    field: keyof UrlForm,
    value: string | number | boolean | null
  ) => {
    setUrls(urls.map(u => u.id === id ? { ...u, [field]: value, error: null } : u));
  };

  // Validate URL format
  const validateUrl = (url: string): boolean => {
    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    return urlRegex.test(url);
  };

  // Validate form data
  const validateForm = (urlData: UrlForm): string[] => {
    const errors: string[] = [];

    if (!urlData.url.trim()) {
      errors.push('URL is required');
    } else if (!validateUrl(urlData.url)) {
      errors.push('Invalid URL format. Must start with http:// or https://');
    }

    if (urlData.validity && (!Number.isInteger(Number(urlData.validity)) || Number(urlData.validity) <= 0)) {
      errors.push('Validity must be a positive integer');
    }

    if (urlData.shortcode && !/^[a-zA-Z0-9]{3,20}$/.test(urlData.shortcode)) {
      errors.push('Shortcode must be alphanumeric and 3-20 characters long');
    }

    return errors;
  };

  // Shorten single URL
  const shortenUrl = async (id: number) => {
    const urlData = urls.find(u => u.id === id);
    if (!urlData) return;

    // Client-side validation
    const validationErrors = validateForm(urlData);
    if (validationErrors.length > 0) {
      updateUrl(id, 'error', validationErrors.join('. '));
      return;
    }

    // Set loading state
    setUrls(urls.map(u => u.id === id ? { ...u, loading: true, error: null } : u));

    // Log user action
    if (logger) {
      logger.logUserAction('Shorten URL Request', { 
        urlLength: urlData.url.length,
        hasCustomShortcode: !!urlData.shortcode,
        validity: urlData.validity || 30,
        user: user?.email
      });
    }

    try {
      const requestData: UrlData = {
        url: urlData.url,
        validity: urlData.validity || 30
      };

      if (urlData.shortcode) {
        requestData.shortcode = urlData.shortcode;
      }

      const result = await urlApi.createShortUrl(requestData);

      if (result.success) {
        const newResult: ShortUrl = {
          id: Date.now(),
          originalUrl: urlData.url,
          shortLink: result.data!.shortLink,
          expiry: result.data!.expiry,
          validity: urlData.validity || 30,
          createdAt: new Date().toISOString(),
          createdBy: user?.email
        };

        setResults(prev => [newResult, ...prev]);
        
        // Clear the form
        updateUrl(id, 'url', '');
        updateUrl(id, 'shortcode', '');
        updateUrl(id, 'validity', 30);
        
        showNotification('Short URL created successfully!', 'success');
        
        // Log success
        if (logger) {
          logger.logUserAction('URL Shortened Successfully', { 
            shortLink: result.data!.shortLink,
            user: user?.email
          });
        }
      } else {
        updateUrl(id, 'error', result.error || 'Failed to create short URL');
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error: unknown) {
      updateUrl(id, 'error', 'Network error. Please try again.');
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setUrls(urls.map(u => u.id === id ? { ...u, loading: false } : u));
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Copied to clipboard!', 'success');
      if (logger) {
        logger.logUserAction('Copy to Clipboard', { text, user: user?.email });
      }
    });
  };

  // Open URL in new tab
  const openUrl = (url: string) => {
    window.open(url, '_blank');
    if (logger) {
      logger.logUserAction('Open URL', { url, user: user?.email });
    }
  };

  // Show notification
  const showNotification = (message: string, severity: NotificationState['severity'] = 'info') => {
    setNotification({ open: true, message, severity });
  };

  // Close notification
  const closeNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        URL Shortener
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 2 }}>
        Shorten up to 5 URLs concurrently with custom shortcodes and validity periods
      </Typography>
      
      {/* User Info */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Chip
          icon={<PersonIcon />}
          label={`Logged in as: ${user?.email} (${user?.rollNumber})`}
          variant="outlined"
          color="primary"
        />
      </Box>

      <Grid container spacing={3}>
        {/* URL Forms */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Create Short URLs</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addUrlForm}
                  disabled={urls.length >= 5}
                >
                  Add URL ({urls.length}/5)
                </Button>
              </Box>

              {urls.map((urlData, index) => (
                <Box key={urlData.id} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">
                      URL #{index + 1}
                    </Typography>
                    {urls.length > 1 && (
                      <IconButton size="small" onClick={() => removeUrlForm(urlData.id)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    label="Original URL"
                    placeholder="https://example.com/very-long-url"
                    value={urlData.url}
                    onChange={(e) => updateUrl(urlData.id, 'url', e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                    error={!!urlData.error && urlData.error.includes('URL')}
                  />

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Validity (minutes)"
                        type="number"
                        value={urlData.validity}
                        onChange={(e) => updateUrl(urlData.id, 'validity', parseInt(e.target.value) || 30)}
                        size="small"
                        placeholder="30"
                        error={!!urlData.error && urlData.error.includes('Validity')}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Custom Shortcode (optional)"
                        value={urlData.shortcode}
                        onChange={(e) => updateUrl(urlData.id, 'shortcode', e.target.value)}
                        size="small"
                        placeholder="abc123"
                        error={!!urlData.error && urlData.error.includes('Shortcode')}
                      />
                    </Grid>
                  </Grid>

                  {urlData.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {urlData.error}
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => shortenUrl(urlData.id)}
                    disabled={urlData.loading || !urlData.url}
                    startIcon={urlData.loading ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    {urlData.loading ? 'Creating...' : 'Create Short URL'}
                  </Button>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Shortened URLs ({results.length})
              </Typography>

              {results.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No shortened URLs yet. Create some URLs to see them here.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                  {results.map((result) => (
                    <Paper 
                      key={result.id} 
                      variant="outlined" 
                      sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Original: {result.originalUrl}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body1" color="primary" sx={{ flexGrow: 1 }}>
                          {result.shortLink}
                        </Typography>
                        <Tooltip title="Copy to clipboard">
                          <IconButton size="small" onClick={() => copyToClipboard(result.shortLink)}>
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open in new tab">
                          <IconButton size="small" onClick={() => openUrl(result.shortLink)}>
                            <LaunchIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          icon={<TimeIcon />}
                          label={`Expires: ${moment(result.expiry).format('MMM DD, HH:mm')}`}
                          size="small"
                          color={moment().isAfter(result.expiry) ? 'error' : 'success'}
                        />
                        <Chip 
                          label={`${result.validity} min`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={`Created: ${moment(result.createdAt).format('HH:mm')}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default UrlShortener;