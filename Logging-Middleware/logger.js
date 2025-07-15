const moment = require('moment');

const logger = {
  log: (level, message, meta) => {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] [${level}] ${message}`);
  },

  error: (message, meta) => {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] [ERROR] ${message}`);
  },

  warn: (message, meta) => {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] [WARN] ${message}`);
  },

  info: (message, meta) => {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] [INFO] ${message}`);
  },

  debug: (message, meta) => {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] [DEBUG] ${message}`);
  },

  expressMiddleware: () => {
    return (req, res, next) => {
      console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${req.method} ${req.originalUrl}`);
      next();
    };
  },

  browserLogger: () => {
    return {
      logPageView: (page) => console.log(`Page: ${page}`),
      logUserAction: (action) => console.log(`Action: ${action}`),
      logAPICall: (method, url) => console.log(`API: ${method} ${url}`),
      logError: (error) => console.log(`Error: ${error}`)
    };
  }
};

module.exports = logger;