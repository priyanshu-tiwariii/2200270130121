const express = require('express');
const moment = require('moment');
const { urlUtils } = require('../models/urls');
const { generateSafeShortcode } = require('../utils/shortcodeGenerator');
const customLogger = require('../../Logging-Middleware');

const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const { url, validity, shortcode } = req.body;
    const { user } = req;
    
    customLogger.info('Create short URL request', {
      user: user.email,
      url: url ? url.substring(0, 50) + '...' : null,
      validity,
      customShortcode: !!shortcode
    });
    
    
    if (!url) {
      customLogger.warn('Create URL failed - Missing URL', { user: user.email });
      return res.status(400).json({
        error: 'Bad Request',
        message: 'URL is required'
      });
    }
    
   
    if (!urlUtils.isValidUrl(url)) {
      customLogger.warn('Create URL failed - Invalid URL format', {
        user: user.email,
        url: url.substring(0, 50)
      });
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid URL format. URL must start with http:// or https://'
      });
    }
    

    let validityMinutes = 30; 
    if (validity !== undefined) {
      if (!Number.isInteger(validity) || validity <= 0) {
        customLogger.warn('Create URL failed - Invalid validity', {
          user: user.email,
          validity
        });
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Validity must be a positive integer representing minutes'
        });
      }
      validityMinutes = validity;
    }
    
    try {
       
        const existingShortcodes = urlUtils.getAllUrls().map(u => u.shortcode);
      
   
      const finalShortcode = generateSafeShortcode(shortcode, existingShortcodes);
      
      const newUrl = urlUtils.addUrl(url, finalShortcode, validityMinutes, user);
      
      customLogger.info('Short URL created successfully', {
        user: user.email,
        shortcode: finalShortcode,
        originalUrl: url.substring(0, 50) + '...',
        validity: validityMinutes
      });
      
     
      res.status(201).json({
        shortLink: `http://localhost:5000/${newUrl.shortcode}`,
        expiry: newUrl.expiry
      });
      
    } catch (shortcodeError) {
      customLogger.warn('Create URL failed - Shortcode error', {
        user: user.email,
        error: shortcodeError.message
      });
      return res.status(409).json({
        error: 'Conflict',
        message: shortcodeError.message
      });
    }
    
  } catch (error) {
    customLogger.error('Create URL error', {
      user: req.user?.email,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating the short URL'
    });
  }
});


router.get('/:shortcode', (req, res) => {
  try {
    const { shortcode } = req.params;
    const { user } = req;
    
    customLogger.info('Get URL statistics request', {
      user: user.email,
      shortcode
    });
    
   
    if (!shortcode) {
      customLogger.warn('Get statistics failed - Missing shortcode', {
        user: user.email
      });
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Shortcode parameter is required'
      });
    }
    
    
    const stats = urlUtils.getUrlStatistics(shortcode);
    
    if (!stats) {
      customLogger.warn('Get statistics failed - URL not found', {
        user: user.email,
        shortcode
      });
      return res.status(404).json({
        error: 'Not Found',
        message: 'Short URL not found'
      });
    }
    
    customLogger.info('URL statistics retrieved', {
      user: user.email,
      shortcode,
      totalClicks: stats.totalClicks
    });
    
   
    res.json({
      shortcode: stats.shortcode,
      originalUrl: stats.originalUrl,
      shortLink: stats.shortLink,
      createdAt: stats.createdAt,
      expiry: stats.expiry,
      validityMinutes: stats.validityMinutes,
      totalClicks: stats.totalClicks,
      isActive: stats.isActive,
      clickData: stats.clickData,
      createdBy: stats.createdBy
    });
    
  } catch (error) {
    customLogger.error('Get statistics error', {
      user: req.user?.email,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while retrieving URL statistics'
    });
  }
});


router.get('/', (req, res) => {
  try {
    const { user } = req;
    
    customLogger.info('Get all URLs request', { user: user.email });
    
    const allUrls = urlUtils.getAllUrls();
    
   
    const userUrls = allUrls.filter(url => 
      !url.createdBy || url.createdBy.email === user.email
    );
    
    const urlsWithStats = userUrls.map(url => ({
      shortcode: url.shortcode,
      originalUrl: url.originalUrl,
      shortLink: `http://localhost:5000/${url.shortcode}`,
      createdAt: url.createdAt,
      expiry: url.expiry,
      validityMinutes: url.validityMinutes,
      totalClicks: url.totalClicks,
      isActive: url.isActive,
      isExpired: moment().isAfter(url.expiry),
      createdBy: url.createdBy
    }));
    
    customLogger.info('All URLs retrieved', {
      user: user.email,
      totalUrls: urlsWithStats.length
    });
    
    res.json({
      totalUrls: urlsWithStats.length,
      urls: urlsWithStats
    });
    
  } catch (error) {
    customLogger.error('Get all URLs error', {
      user: req.user?.email,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while retrieving URLs'
    });
  }
});

module.exports = router;