const jwt = require('jsonwebtoken');
const customLogger = require('../../Logging-Middleware');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
   
    if (!authHeader) {
      customLogger.warn('Authentication failed - No authorization header', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header is required'
      });
    }
    
  
    if (!authHeader.startsWith('Bearer ')) {
      customLogger.warn('Authentication failed - Invalid authorization format', {
        authHeader: authHeader.substring(0, 20),
        url: req.originalUrl,
        method: req.method
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header must be in Bearer format'
      });
    }
  
    const token = authHeader.substring(7);
    
    if (!token) {
      customLogger.warn('Authentication failed - Empty token', {
        url: req.originalUrl,
        method: req.method
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token is required'
      });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
   
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        customLogger.warn('Authentication failed - Token expired', {
          email: decoded.email,
          exp: decoded.exp,
          url: req.originalUrl
        });
        
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired'
        });
      }
      
     
      req.user = {
        email: decoded.email,
        rollNumber: decoded.rollNumber,
        clientId: decoded.clientId
      };
      
      customLogger.info('Authentication successful', {
        email: decoded.email,
        rollNumber: decoded.rollNumber,
        url: req.originalUrl,
        method: req.method
      });
      
      next();
      
    } catch (jwtError) {
      customLogger.warn('Authentication failed - Invalid token', {
        error: jwtError.message,
        url: req.originalUrl,
        method: req.method
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
    
  } catch (error) {
    customLogger.error('Authentication middleware error', {
      error: error.message,
      url: req.originalUrl,
      method: req.method
    });
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication processing failed'
    });
  }
};

module.exports = authMiddleware;