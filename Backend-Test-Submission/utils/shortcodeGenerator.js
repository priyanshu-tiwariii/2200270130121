const { v4: uuidv4 } = require('uuid');
const customLogger = require('../../Logging-Middleware');


const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * 
 * @param {number} length 
 * @returns {string}
 */
const generateShortcode = (length = 6) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return result;
};

/**
 *
 * @param {Array} existingShortcodes
 * @param {number} length 
 * @returns {string} 
 */
const generateUniqueShortcode = (existingShortcodes = [], length = 6) => {
  let shortcode;
  let attempts = 0;
  const maxAttempts = 1000;
  
  customLogger.debug('Generating unique shortcode', {
    existingCount: existingShortcodes.length,
    desiredLength: length
  });
  
  do {
    shortcode = generateShortcode(length);
    attempts++;
    
  
    if (attempts >= maxAttempts) {
      customLogger.warn('Max attempts reached for shortcode generation, using UUID fallback', {
        attempts,
        maxAttempts
      });
      shortcode = uuidv4().replace(/-/g, '').substring(0, 8);
      break;
    }
  } while (existingShortcodes.includes(shortcode));
  
  customLogger.info('Unique shortcode generated', {
    shortcode,
    attempts,
    length: shortcode.length
  });
  
  return shortcode;
};

/**
 * 
 * @param {string} shortcode 
 * @returns {boolean} 
 */
const isValidShortcode = (shortcode) => {
  const regex = /^[a-zA-Z0-9]{3,20}$/;
  const isValid = regex.test(shortcode);
  
  customLogger.debug('Shortcode validation', {
    shortcode,
    isValid,
    length: shortcode?.length
  });
  
  return isValid;
};

/**
 * 
 * @param {string|null} customShortcode 
 * @param {Array} existingShortcodes 
 * @returns {string}
 * @throws {Error}
 */
const generateSafeShortcode = (customShortcode = null, existingShortcodes = []) => {
  customLogger.info('Generating safe shortcode', {
    hasCustomShortcode: !!customShortcode,
    customShortcode: customShortcode || 'auto-generated',
    existingCount: existingShortcodes.length
  });
  
  if (customShortcode) {
  
    if (!isValidShortcode(customShortcode)) {
      customLogger.warn('Invalid custom shortcode format', {
        shortcode: customShortcode,
        requirements: 'alphanumeric, 3-20 characters'
      });
      throw new Error('Custom shortcode must be alphanumeric and 3-20 characters long');
    }
    
    
    if (existingShortcodes.includes(customShortcode)) {
      customLogger.warn('Custom shortcode already exists', {
        shortcode: customShortcode,
        existingCount: existingShortcodes.length
      });
      throw new Error('Custom shortcode already exists. Please choose a different one.');
    }
    
    customLogger.info('Custom shortcode validated and approved', {
      shortcode: customShortcode
    });
    
    return customShortcode;
  }
  
 
  const generatedShortcode = generateUniqueShortcode(existingShortcodes);
  
  customLogger.info('Auto-generated shortcode created', {
    shortcode: generatedShortcode,
    length: generatedShortcode.length
  });
  
  return generatedShortcode;
};

/**
 * 
 * @param {Array} existingShortcodes 
 * @returns {Object}
 */
const getShortcodeStats = (existingShortcodes = []) => {
  const stats = {
    total: existingShortcodes.length,
    lengths: {},
    collisionProbability: 0
  };
  
 
  existingShortcodes.forEach(code => {
    const len = code.length;
    stats.lengths[len] = (stats.lengths[len] || 0) + 1;
  });
  
 
  const charsetSize = CHARSET.length;
  const possibleCombinations = Math.pow(charsetSize, 6);
  stats.collisionProbability = existingShortcodes.length / possibleCombinations;
  
  customLogger.debug('Shortcode statistics calculated', stats);
  
  return stats;
};

/**
 * 
 * @param {string} input 
 * @returns {string}
 */
const normalizeShortcode = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
 
  const normalized = input.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  
  customLogger.debug('Shortcode normalized', {
    original: input,
    normalized,
    removedChars: input.length - normalized.length
  });
  
  return normalized;
};

module.exports = {
  generateShortcode,
  generateUniqueShortcode,
  generateSafeShortcode,
  isValidShortcode,
  getShortcodeStats,
  normalizeShortcode
};