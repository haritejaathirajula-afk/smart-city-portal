const morgan = require('morgan');
const env = require('../config/env');

const requestLogger = env.isProduction
  ? morgan('combined')
  : morgan(':method :url :status :res[content-length] - :response-time ms');

module.exports = requestLogger;
