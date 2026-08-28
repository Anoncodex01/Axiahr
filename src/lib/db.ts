// lib/db.ts
import mysql, { Pool, PoolOptions } from "mysql2/promise";

declare global {
  // Ensures global type works
  // eslint-disable-next-line no-var
  var _mysqlPool: Pool | undefined;
}

export function getDbPool(): Pool {
  if (!global._mysqlPool) {
    const config: PoolOptions = {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "axia",
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
      queueLimit: 0,
      charset: "utf8mb4_general_ci",
    };

    global._mysqlPool = mysql.createPool(config);
  }

  return global._mysqlPool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = getDbPool();
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function execute(sql: string, params?: any[]): Promise<void> {
  const pool = getDbPool();
  await pool.execute(sql, params);
}
