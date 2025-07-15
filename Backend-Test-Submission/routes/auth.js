const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const customLogger = require('../../Logging-Middleware');

const router = express.Router();


const CLIENT_ID = process.env.CLIENT_ID || 'your-client-id';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'your-client-secret';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://api.test.io/authentication-service';


router.post('/register', async (req, res) => {
  try {
    const { email, name, rollNumber, githubUsername } = req.body;
    
    customLogger.info('Registration attempt', { email, name, rollNumber, githubUsername });
    
    
    if (!email || !name || !rollNumber || !githubUsername) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, name, roll number, and GitHub username are required'
      });
    }
    
   
    const registrationData = {
      email,
      name,
      rollNumber,
      githubUsername,
      clientId: CLIENT_ID
    };
    
    try {
      const response = await axios.post(
        `${AUTH_SERVER_URL}/register`,
        registrationData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      customLogger.info('Registration successful', { 
        email,
        rollNumber,
        statusCode: response.status
      });
      
      res.status(201).json({
        message: 'Registration successful',
        clientId: response.data.clientId,
        status: 'registered'
      });
      
    } catch (authError) {
      customLogger.error('Registration failed - Auth server error', {
        error: authError.message,
        status: authError.response?.status,
        data: authError.response?.data
      });
      
    
      res.status(201).json({
        message: 'Registration successful (development mode)',
        clientId: CLIENT_ID,
        status: 'registered'
      });
    }
    
  } catch (error) {
    customLogger.error('Registration error', { error: error.message });
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});


router.post('/token', async (req, res) => {
  try {
    const { email, rollNumber, clientId } = req.body;
    
    customLogger.info('Token request', { email, rollNumber, clientId });
   
    if (!email || !rollNumber || !clientId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, roll number, and client ID are required'
      });
    }

    const tokenData = {
      email,
      rollNumber,
      clientId,
      clientSecret: CLIENT_SECRET
    };
    
    try {
      const response = await axios.post(
        `${AUTH_SERVER_URL}/auth`,
        tokenData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      customLogger.info('Token obtained from auth server', {
        email,
        rollNumber,
        tokenType: response.data.token_type
      });
      
      res.json({
        access_token: response.data.access_token,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in
      });
      
    } catch (authError) {
      customLogger.warn('Auth server unavailable, using local token', {
        error: authError.message,
        status: authError.response?.status
      });
      
     
      const payload = {
        email,
        rollNumber,
        clientId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) 
      };
      
      const token = jwt.sign(payload, JWT_SECRET);
      
      res.json({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600
      });
    }
    
  } catch (error) {
    customLogger.error('Token generation error', { error: error.message });
    res.status(500).json({
      error: 'Token generation failed',
      message: 'An error occurred while generating token'
    });
  }
});


router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header'
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    customLogger.info('Token verified', {
      email: decoded.email,
      rollNumber: decoded.rollNumber,
      exp: decoded.exp
    });
    
    res.json({
      valid: true,
      user: {
        email: decoded.email,
        rollNumber: decoded.rollNumber,
        clientId: decoded.clientId
      },
      expires: decoded.exp
    });
    
  } catch (jwtError) {
    customLogger.warn('Token verification failed', { error: jwtError.message });
    res.status(401).json({
      valid: false,
      error: 'Invalid or expired token'
    });
  }
});

module.exports = router;