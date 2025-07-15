const moment = require('moment');
const chalk = require('chalk');

class CustomLogger {
  constructor() {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    this.currentLevel = this.levels.DEBUG;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    const baseMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      return `${baseMessage} | Meta: ${JSON.stringify(meta)}`;
    }
    
    return baseMessage;
  }

  colorizeLevel(level) {
    switch (level) {
      case 'ERROR': return chalk.red(level);
      case 'WARN': return chalk.yellow(level);
      case 'INFO': return chalk.blue(level);
      case 'DEBUG': return chalk.green(level);
      default: return level;
    }
  }

  log(level, message, meta = {}) {
    if (this.levels[level] <= this.currentLevel) {
      const formattedMessage = this.formatMessage(level, message, meta);
      
    
      if (typeof console !== 'undefined') {
        if (typeof chalk !== 'undefined' && chalk.supportsColor) {
          console.log(this.colorizeLevel(level) + formattedMessage.slice(formattedMessage.indexOf(']') + 1));
        } else {
          console.log(formattedMessage);
        }
      }
    }
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

 
  expressMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
      
     
      this.info(`Incoming Request: ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        body: req.body,
        query: req.query,
        params: req.params
      });

    
      const originalJson = res.json;
      res.json = function(data) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        logger.info(`Outgoing Response: ${res.statusCode}`, {
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          responseData: data
        });
        
        return originalJson.call(this, data);
      };

    
      const originalRedirect = res.redirect;
      res.redirect = function(status, url) {
        if (typeof status === 'string') {
          url = status;
          status = 302;
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        logger.info(`Redirect Response: ${status}`, {
          statusCode: status,
          redirectUrl: url,
          duration: `${duration}ms`
        });
        
        return originalRedirect.call(this, status, url);
      };

      next();
    };
  }


  browserLogger() {
    return {
      logPageView: (pageName, meta = {}) => {
        this.info(`Page View: ${pageName}`, {
          page: pageName,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          ...meta
        });
      },

      logUserAction: (action, meta = {}) => {
        this.info(`User Action: ${action}`, {
          action: action,
          timestamp: new Date().toISOString(),
          ...meta
        });
      },

      logAPICall: (method, url, data = null, response = null) => {
        this.info(`API Call: ${method} ${url}`, {
          method,
          url,
          requestData: data,
          responseData: response,
          timestamp: new Date().toISOString()
        });
      },

      logError: (error, context = {}) => {
        this.error(`Frontend Error: ${error.message || error}`, {
          error: error.toString(),
          stack: error.stack,
          context,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

const logger = new CustomLogger();

module.exports = logger;