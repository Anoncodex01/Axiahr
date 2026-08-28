#!/bin/bash

# Setup Cron Job for Automated Nightly Backups

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_SCRIPT="/var/www/axia-nextjs/scripts/sync-database-backup.sh"
CRON_LOG="/var/log/axia-db/cron-backup.log"

echo -e "${GREEN}Setting up automated nightly database backups...${NC}"

# Make backup script executable
chmod +x ${BACKUP_SCRIPT}

# Create cron job entry (runs daily at 2:00 AM)
CRON_ENTRY="0 2 * * * ${BACKUP_SCRIPT} >> ${CRON_LOG} 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "${BACKUP_SCRIPT}"; then
    echo -e "${YELLOW}Cron job already exists. Updating...${NC}"
    crontab -l 2>/dev/null | grep -v "${BACKUP_SCRIPT}" | crontab -
fi

# Add cron job
(crontab -l 2>/dev/null; echo "${CRON_ENTRY}") | crontab -

echo -e "${GREEN}✓ Cron job added successfully${NC}"
echo -e "${YELLOW}Backup will run daily at 2:00 AM${NC}"
echo ""
echo "To view cron jobs: crontab -l"
echo "To remove cron job: crontab -e (then delete the line)"

