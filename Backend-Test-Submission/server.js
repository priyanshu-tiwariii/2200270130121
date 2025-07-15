require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const moment = require('moment');


const customLogger = require('../Logging-Middleware');


const authRoutes = require('./routes/auth');
const shorturlsRouter = require('./routes/shorturls');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(helmet());


app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(morgan('combined'));


app.use(customLogger.expressMiddleware());


app.use('/auth', authRoutes);


app.use('/shorturls', authMiddleware, shorturlsRouter);


app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const { urls } = require('./models/url');
  
  customLogger.info(`Redirect request for shortcode: ${shortcode}`);
  
  const urlData = urls.find(u => u.shortcode === shortcode);
  
  if (!urlData) {
    customLogger.warn(`Short URL not found: ${shortcode}`);
    return res.status(404).json({
      error: 'Short URL not found',
      message: 'The requested short URL does not exist'
    });
  }
  

  if (moment().isAfter(urlData.expiry)) {
    customLogger.warn(`Short URL expired: ${shortcode}`);
    return res.status(410).json({
      error: 'Short URL expired',
      message: 'The short URL has expired and is no longer valid'
    });
  }
  
 
  const clickData = {
    timestamp: moment().toISOString(),
    source: req.get('Referer') || 'Direct',
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    location: 'India'
  };
  
  urlData.clicks.push(clickData);
  urlData.totalClicks++;
  
  customLogger.info(`Redirecting to: ${urlData.originalUrl}`, {
    shortcode,
    originalUrl: urlData.originalUrl,
    totalClicks: urlData.totalClicks
  });
  
 
  res.redirect(302, urlData.originalUrl);
});


app.get('/health', (req, res) => {
  customLogger.info('Health check requested');
  res.json({
    status: 'OK',
    timestamp: moment().toISOString(),
    service: 'URL Shortener Microservice',
    version: '1.0.0'
  });
});


app.use('*', (req, res) => {
  customLogger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});


app.use((err, req, res, next) => {
  customLogger.error('Global error handler triggered', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

app.listen(PORT, () => {
  customLogger.info(`URL Shortener Microservice started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: moment().toISOString()
  });
  
  console.log(`URL Shortener running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

