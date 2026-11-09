const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  db: {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT, 10) || 3306,
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'smart_city_db',
    uri: process.env.MYSQL_URL || process.env.DATABASE_URL || null,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS !== 'false',
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 0,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_dev_secret_key_smart_city_portal',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  uploads: {
    directory: path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads'),
    maxSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 5 * 1024 * 1024,
  },
};

module.exports = env;
