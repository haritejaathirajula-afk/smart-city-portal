const mysql = require('mysql2/promise');
const env = require('./env');

let pool = null;

function getPool() {
  if (!pool) {
    if (env.db.uri) {
      pool = mysql.createPool(env.db.uri);
    } else {
      pool = mysql.createPool({
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database,
        waitForConnections: env.db.waitForConnections,
        connectionLimit: env.db.connectionLimit,
        queueLimit: env.db.queueLimit,
        connectTimeout: 3000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
    }
  }
  return pool;
}

/**
 * Close database connection pool (useful for tests and shutdown)
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Execute parameterized query with connection pool
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<[any, any]>}
 */
async function query(sql, params = []) {
  const connectionPool = getPool();
  return connectionPool.query(sql, params);
}

/**
 * Check if the database is reachable
 * @returns {Promise<{ connected: boolean, message: string, details?: object }>}
 */
async function checkConnection() {
  try {
    const connectionPool = getPool();
    const connection = await connectionPool.getConnection();
    await connection.ping();
    connection.release();
    return {
      connected: true,
      message: 'Database connection established successfully',
      details: {
        host: env.db.host,
        port: env.db.port,
        database: env.db.database,
      },
    };
  } catch (error) {
    return {
      connected: false,
      message: `Database connection failed: ${error.message}`,
      code: error.code || 'UNKNOWN_ERROR',
      details: {
        host: env.db.host,
        port: env.db.port,
        database: env.db.database,
      },
    };
  }
}

module.exports = {
  getPool,
  closePool,
  query,
  checkConnection,
};
