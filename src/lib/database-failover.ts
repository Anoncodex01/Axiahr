/**
 * Database Failover Utility
 * Automatically switches to backup database if primary database is unavailable
 */

import { testConnection } from './database';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  label: string;
}

// Primary database (cPanel)
const PRIMARY_DB: DatabaseConfig = {
  host: process.env.DB_HOST || '192.250.229.162',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  label: 'cPanel (Primary)'
};

// Backup database (VPS)
const BACKUP_DB: DatabaseConfig = {
  host: process.env.DB_BACKUP_HOST || 'localhost',
  user: process.env.DB_BACKUP_USER || 'axia_backup_user',
  password: process.env.DB_BACKUP_PASSWORD || '',
  database: process.env.DB_BACKUP_NAME || 'axia_backup',
  port: parseInt(process.env.DB_BACKUP_PORT || '3306'),
  label: 'VPS Backup'
};

let currentDb: DatabaseConfig = PRIMARY_DB;
let lastFailoverCheck: number = 0;
const FAILOVER_CHECK_INTERVAL = 60000; // Check every minute

/**
 * Test database connection
 */
async function testDbConnection(config: DatabaseConfig): Promise<boolean> {
  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      connectTimeout: 5000
    });
    await connection.query('SELECT 1');
    await connection.end();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current active database configuration
 * Automatically switches to backup if primary is down
 */
export async function getActiveDatabaseConfig(): Promise<DatabaseConfig> {
  const now = Date.now();
  
  // Only check failover periodically to avoid performance impact
  if (now - lastFailoverCheck > FAILOVER_CHECK_INTERVAL) {
    lastFailoverCheck = now;
    
    // If currently using backup, try to switch back to primary
    if (currentDb.label === BACKUP_DB.label) {
      const primaryAvailable = await testDbConnection(PRIMARY_DB);
      if (primaryAvailable) {
        console.log('🔄 Switching back to primary database (cPanel)');
        currentDb = PRIMARY_DB;
        return currentDb;
      }
    }
    
    // If currently using primary, check if it's still available
    if (currentDb.label === PRIMARY_DB.label) {
      const primaryAvailable = await testDbConnection(PRIMARY_DB);
      if (!primaryAvailable) {
        console.warn('⚠️ Primary database unavailable, switching to backup');
        const backupAvailable = await testDbConnection(BACKUP_DB);
        if (backupAvailable) {
          console.log('✅ Switched to backup database (VPS)');
          currentDb = BACKUP_DB;
        } else {
          console.error('❌ Both databases are unavailable!');
          throw new Error('Database service is temporarily unavailable');
        }
      }
    }
  }
  
  return currentDb;
}

/**
 * Force switch to specific database
 */
export async function switchDatabase(useBackup: boolean): Promise<boolean> {
  const targetDb = useBackup ? BACKUP_DB : PRIMARY_DB;
  const available = await testDbConnection(targetDb);
  
  if (available) {
    currentDb = targetDb;
    console.log(`✅ Switched to ${targetDb.label}`);
    return true;
  }
  
  console.error(`❌ Cannot switch to ${targetDb.label} - connection failed`);
  return false;
}

/**
 * Get current database status
 */
export function getCurrentDatabaseStatus(): {
  current: string;
  primaryAvailable: boolean;
  backupAvailable: boolean;
} {
  return {
    current: currentDb.label,
    primaryAvailable: false, // Will be updated by async check
    backupAvailable: false
  };
}

