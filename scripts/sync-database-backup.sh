#!/bin/bash

# Database Backup and Sync Script
# Syncs data from cPanel database to VPS backup database

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration - UPDATE THESE VALUES
CPANEL_DB_HOST="192.250.229.162"
CPANEL_DB_USER="nisapoti_Axia"
CPANEL_DB_PASSWORD="Alvin@2025"
CPANEL_DB_NAME="nisapoti_Axia"
CPANEL_DB_PORT="3306"

# VPS Backup Database Configuration
VPS_DB_HOST="localhost"
VPS_DB_USER="axia_backup_user"
VPS_DB_PASSWORD=""  # Will be read from credentials file
VPS_DB_NAME="axia_backup"
VPS_DB_PORT="3306"

# Backup settings
BACKUP_DIR="/var/backups/axia-db"
LOG_DIR="/var/log/axia-db"
LOG_FILE="${LOG_DIR}/backup-$(date +%Y%m%d-%H%M%S).log"
MAX_BACKUPS=7  # Keep last 7 days of backups

# Load VPS database password from credentials file
if [ -f /root/axia-db-backup-credentials.txt ]; then
    VPS_DB_PASSWORD=$(grep "Database Password:" /root/axia-db-backup-credentials.txt | awk '{print $3}')
fi

# If password not found, prompt for it
if [ -z "$VPS_DB_PASSWORD" ]; then
    echo -e "${YELLOW}VPS database password not found. Please enter it:${NC}"
    read -s VPS_DB_PASSWORD
fi

# Create directories if they don't exist
mkdir -p ${BACKUP_DIR}
mkdir -p ${LOG_DIR}

# Function to log messages
log() {
    echo -e "$1" | tee -a ${LOG_FILE}
}

# Function to test database connection
test_connection() {
    local host=$1
    local user=$2
    local password=$3
    local database=$4
    local port=$5
    
    mysql -h ${host} -P ${port} -u ${user} -p${password} -e "USE ${database}; SELECT 1;" > /dev/null 2>&1
    return $?
}

log "${GREEN}=========================================="
log "Database Backup and Sync Started"
log "Date: $(date)"
log "==========================================${NC}"

# Test cPanel database connection
log "${YELLOW}Testing cPanel database connection...${NC}"
if ! test_connection ${CPANEL_DB_HOST} ${CPANEL_DB_USER} ${CPANEL_DB_PASSWORD} ${CPANEL_DB_NAME} ${CPANEL_DB_PORT}; then
    log "${RED}ERROR: Cannot connect to cPanel database!${NC}"
    log "${RED}Host: ${CPANEL_DB_HOST}:${CPANEL_DB_PORT}${NC}"
    log "${RED}Database: ${CPANEL_DB_NAME}${NC}"
    exit 1
fi
log "${GREEN}✓ cPanel database connection successful${NC}"

# Test VPS database connection
log "${YELLOW}Testing VPS backup database connection...${NC}"
if ! test_connection ${VPS_DB_HOST} ${VPS_DB_USER} ${VPS_DB_PASSWORD} ${VPS_DB_NAME} ${VPS_DB_PORT}; then
    log "${RED}ERROR: Cannot connect to VPS backup database!${NC}"
    log "${RED}Host: ${VPS_DB_HOST}:${VPS_DB_PORT}${NC}"
    log "${RED}Database: ${VPS_DB_NAME}${NC}"
    exit 1
fi
log "${GREEN}✓ VPS backup database connection successful${NC}"

# Create backup filename with timestamp
BACKUP_FILE="${BACKUP_DIR}/axia-backup-$(date +%Y%m%d-%H%M%S).sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"

log "${YELLOW}Step 1: Creating backup from cPanel database...${NC}"

# Create mysqldump with all data
mysqldump \
    -h ${CPANEL_DB_HOST} \
    -P ${CPANEL_DB_PORT} \
    -u ${CPANEL_DB_USER} \
    -p${CPANEL_DB_PASSWORD} \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --quick \
    --lock-tables=false \
    ${CPANEL_DB_NAME} > ${BACKUP_FILE} 2>>${LOG_FILE}

if [ $? -ne 0 ]; then
    log "${RED}ERROR: Backup creation failed!${NC}"
    exit 1
fi

# Compress backup
log "${YELLOW}Step 2: Compressing backup...${NC}"
gzip ${BACKUP_FILE}
BACKUP_FILE=${BACKUP_FILE_COMPRESSED}

BACKUP_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
log "${GREEN}✓ Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"

# Restore to VPS database
log "${YELLOW}Step 3: Restoring backup to VPS database...${NC}"

# Drop and recreate database to ensure clean state
mysql -h ${VPS_DB_HOST} -P ${VPS_DB_PORT} -u ${VPS_DB_USER} -p${VPS_DB_PASSWORD} << EOF 2>>${LOG_FILE}
DROP DATABASE IF EXISTS ${VPS_DB_NAME};
CREATE DATABASE ${VPS_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

if [ $? -ne 0 ]; then
    log "${RED}ERROR: Failed to recreate VPS database!${NC}"
    exit 1
fi

# Restore backup
log "${YELLOW}Restoring data...${NC}"
gunzip -c ${BACKUP_FILE} | mysql -h ${VPS_DB_HOST} -P ${VPS_DB_PORT} -u ${VPS_DB_USER} -p${VPS_DB_PASSWORD} ${VPS_DB_NAME} 2>>${LOG_FILE}

if [ $? -ne 0 ]; then
    log "${RED}ERROR: Restore failed!${NC}"
    exit 1
fi

log "${GREEN}✓ Data restored to VPS database successfully${NC}"

# Verify restore
log "${YELLOW}Step 4: Verifying restore...${NC}"
TABLE_COUNT=$(mysql -h ${VPS_DB_HOST} -P ${VPS_DB_PORT} -u ${VPS_DB_USER} -p${VPS_DB_PASSWORD} ${VPS_DB_NAME} -e "SHOW TABLES;" 2>/dev/null | wc -l)
log "${GREEN}✓ Restored ${TABLE_COUNT} tables${NC}"

# Clean up old backups (keep last MAX_BACKUPS days)
log "${YELLOW}Step 5: Cleaning up old backups...${NC}"
cd ${BACKUP_DIR}
BACKUP_COUNT=$(ls -1 axia-backup-*.sql.gz 2>/dev/null | wc -l)
if [ ${BACKUP_COUNT} -gt ${MAX_BACKUPS} ]; then
    ls -t axia-backup-*.sql.gz | tail -n +$((${MAX_BACKUPS} + 1)) | xargs rm -f
    log "${GREEN}✓ Removed old backups (keeping last ${MAX_BACKUPS})${NC}"
else
    log "${GREEN}✓ No old backups to remove${NC}"
fi

# Clean up old logs (keep last 30 days)
find ${LOG_DIR} -name "backup-*.log" -mtime +30 -delete 2>/dev/null || true

log "${GREEN}=========================================="
log "Backup and Sync Completed Successfully!"
log "Backup File: ${BACKUP_FILE}"
log "Backup Size: ${BACKUP_SIZE}"
log "Tables Restored: ${TABLE_COUNT}"
log "==========================================${NC}"

# Send notification (optional - configure email or webhook)
# You can add email notification here if needed

exit 0

