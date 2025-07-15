const Logger = require('./logger');

module.exports = {
  expressMiddleware: Logger.expressMiddleware,
  browserLogger: Logger.browserLogger, 
  log: Logger.log,
  error: Logger.error,
  warn: Logger.warn,
  info: Logger.info,
  debug: Logger.debug
};