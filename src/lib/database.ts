import mysql from "mysql2/promise";

// ----------- DATABASE CONFIG -----------
function getDbConfig() {
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),

    waitForConnections: true,
    connectionLimit: 8,      // SAFE LIMIT: cPanel usually allows 10–20 max
    queueLimit: 0,

    connectTimeout: 15000,
    charset: "utf8mb4",
    timezone: "+00:00",

    // The remote host silently drops idle TCP connections, so reusing an old pooled
    // connection fails with ECONNRESET. Keep connections alive and close idle ones
    // well before that happens.
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    maxIdle: 2,
    idleTimeout: 20000,
  };
}

// ----------- SINGLETON POOL (IMPORTANT) -----------
const globalForDb = globalThis as any;

if (!globalForDb.mysqlPool) {
  globalForDb.mysqlPool = mysql.createPool(getDbConfig());
}

const pool: mysql.Pool = globalForDb.mysqlPool;


// ----------- SAFE RETRY DETECTION -----------
const isConnectionError = (error: any): boolean => {
  const msg = error?.message || "";
  const code = error?.code || "";

  const errors = [
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ECONNRESET",
    "PROTOCOL_CONNECTION_LOST",
    "PROTOCOL_ENQUEUE_AFTER_QUIT",
    "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
    "Connection lost",
    "Unable to connect",
    "max_user_connections", // Connection pool exhausted
  ];

  return errors.some((err) => msg.includes(err) || code === err);
};


// ----------- SAFE QUERY WITH RETRIES -----------
export async function executeQuery<T = any>(
  query: string,
  params: any[] = [],
  retries = 2
): Promise<T[]> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const [rows] = await pool.query(query, params);
      return rows as T[];
    } catch (error: any) {
      lastError = error;

      if (isConnectionError(error) && attempt < retries) {
        const delay = Math.pow(2, attempt) * 500; // 0.5s, 1s, 2s
        console.warn(`Retrying DB query in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(`DB Query Failed: ${error.message}`);
    }
  }

  throw lastError;
}


// ----------- SAFE SINGLE QUERY (INSERT/UPDATE/DELETE) -----------
export async function executeSingleQuery(
  query: string,
  params: any[] = []
): Promise<mysql.ResultSetHeader> {
  try {
    const [result] = await pool.execute(query, params);
    return result as mysql.ResultSetHeader;
  } catch (error: any) {
    throw new Error(`DB Write Failed: ${error.message}`);
  }
}


// ----------- BATCH QUERIES (SINGLE CONNECTION) -----------
// Execute multiple queries using a single connection to avoid pool exhaustion
export async function executeBatchQueries<T extends any[]>(
  queries: Array<{ query: string; params?: any[] }>,
  retries = 2
): Promise<T> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const conn = await pool.getConnection().catch((err) => {
      // If we can't get a connection, it might be a pool exhaustion issue
      if (err.message?.includes('max_user_connections') && attempt < retries) {
        return null; // Signal to retry
      }
      throw err;
    });

    if (!conn) {
      // Connection failed, retry with exponential backoff
      const delay = Math.pow(2, attempt) * 500;
      console.warn(`Retrying batch query in ${delay}ms (attempt ${attempt + 1}/${retries + 1})...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    try {
      const results = await Promise.all(
        queries.map(({ query, params = [] }) => 
          conn.query(query, params).then(([rows]) => rows)
        )
      );
      conn.release();
      return results as T;
    } catch (error: any) {
      lastError = error;
      conn.release();
      
      if (isConnectionError(error) && attempt < retries) {
        const delay = Math.pow(2, attempt) * 500;
        console.warn(`Retrying batch query in ${delay}ms (attempt ${attempt + 1}/${retries + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      throw new Error(`Batch Query Failed: ${error.message}`);
    }
  }

  throw lastError || new Error('Batch Query Failed: Unknown error');
}

// ----------- TRANSACTIONS (SAFE RELEASE) -----------
export async function executeTransaction<T>(
  operations: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await operations(conn);
    await conn.commit();
    return result;
  } catch (error: any) {
    await conn.rollback();
    throw new Error(`Transaction Failed: ${error.message}`);
  } finally {
    conn.release(); // ALWAYS release
  }
}


// ----------- SIMPLE CONNECTION TEST -----------
export async function testConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("DB Connected ✔");
    return true;
  } catch (error) {
    console.log("DB Connection Failed ❌", error);
    return false;
  }
}

// ----------- POOL STATISTICS -----------
export function getPoolStats() {
  const poolAny = pool as any;
  return {
    totalConnections: pool.config.connectionLimit || 8,
    activeConnections: poolAny._allConnections?.length || 0,
    idleConnections: poolAny._freeConnections?.length || 0,
    queuedRequests: poolAny._connectionQueue?.length || 0
  };
}

export default pool;
