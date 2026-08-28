#!/bin/bash

# Database Switch Script
# Switches application between cPanel and VPS backup database

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENV_FILE="/var/www/axia-nextjs/.env.production"
BACKUP_ENV_FILE="/var/www/axia-nextjs/.env.production.backup"

# Database configurations
CPANEL_DB_HOST="192.250.229.162"
CPANEL_DB_USER="nisapoti_Axia"
CPANEL_DB_PASSWORD="Alvin@2025"
CPANEL_DB_NAME="nisapoti_Axia"
CPANEL_DB_PORT="3306"

# VPS Backup Database (load from credentials)
VPS_DB_HOST="localhost"  # Or your VPS IP
VPS_DB_USER="axia_backup_user"
VPS_DB_PASSWORD=""
VPS_DB_NAME="axia_backup"
VPS_DB_PORT="3306"

# Load VPS database password
if [ -f /root/axia-db-backup-credentials.txt ]; then
    VPS_DB_PASSWORD=$(grep "Database Password:" /root/axia-db-backup-credentials.txt | awk '{print $3}')
fi

if [ -z "$VPS_DB_PASSWORD" ]; then
    echo -e "${YELLOW}VPS database password not found. Please enter it:${NC}"
    read -s VPS_DB_PASSWORD
fi

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

# Function to switch to cPanel database
switch_to_cpanel() {
    echo -e "${YELLOW}Switching to cPanel database...${NC}"
    
    # Test connection first
    if ! test_connection ${CPANEL_DB_HOST} ${CPANEL_DB_USER} ${CPANEL_DB_PASSWORD} ${CPANEL_DB_NAME} ${CPANEL_DB_PORT}; then
        echo -e "${RED}ERROR: Cannot connect to cPanel database!${NC}"
        return 1
    fi
    
    # Backup current .env file
    if [ -f "${ENV_FILE}" ]; then
        cp ${ENV_FILE} ${BACKUP_ENV_FILE}
    fi
    
    # Update .env file
    cat > ${ENV_FILE} << EOF
# Database Configuration - cPanel (Primary)
DB_HOST=${CPANEL_DB_HOST}
DB_USER=${CPANEL_DB_USER}
DB_PASSWORD=${CPANEL_DB_PASSWORD}
DB_NAME=${CPANEL_DB_NAME}
DB_PORT=${CPANEL_DB_PORT}

# Database Status
DB_SOURCE=cpanel
DB_SWITCHED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
    
    echo -e "${GREEN}✓ Switched to cPanel database${NC}"
    echo -e "${YELLOW}Note: Restart the application for changes to take effect${NC}"
    return 0
}

# Function to switch to VPS backup database
switch_to_vps() {
    echo -e "${YELLOW}Switching to VPS backup database...${NC}"
    
    # Test connection first
    if ! test_connection ${VPS_DB_HOST} ${VPS_DB_USER} ${VPS_DB_PASSWORD} ${VPS_DB_NAME} ${VPS_DB_PORT}; then
        echo -e "${RED}ERROR: Cannot connect to VPS backup database!${NC}"
        return 1
    fi
    
    # Backup current .env file
    if [ -f "${ENV_FILE}" ]; then
        cp ${ENV_FILE} ${BACKUP_ENV_FILE}
    fi
    
    # Update .env file
    cat > ${ENV_FILE} << EOF
# Database Configuration - VPS Backup (Secondary)
DB_HOST=${VPS_DB_HOST}
DB_USER=${VPS_DB_USER}
DB_PASSWORD=${VPS_DB_PASSWORD}
DB_NAME=${VPS_DB_NAME}
DB_PORT=${VPS_DB_PORT}

# Database Status
DB_SOURCE=vps_backup
DB_SWITCHED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
    
    echo -e "${GREEN}✓ Switched to VPS backup database${NC}"
    echo -e "${YELLOW}Note: Restart the application for changes to take effect${NC}"
    return 0
}

# Function to show current database status
show_status() {
    echo -e "${YELLOW}Current Database Configuration:${NC}"
    if [ -f "${ENV_FILE}" ]; then
        echo ""
        grep "^DB_" ${ENV_FILE} | grep -v "PASSWORD" || echo "No database config found"
    else
        echo -e "${RED}No .env file found${NC}"
    fi
}

# Main menu
echo -e "${GREEN}=========================================="
echo "Database Switch Utility"
echo "==========================================${NC}"
echo ""
echo "1. Switch to cPanel database (Primary)"
echo "2. Switch to VPS backup database (Secondary)"
echo "3. Show current database status"
echo "4. Test both database connections"
echo "5. Exit"
echo ""
read -p "Select option [1-5]: " choice

case $choice in
    1)
        switch_to_cpanel
        ;;
    2)
        switch_to_vps
        ;;
    3)
        show_status
        ;;
    4)
        echo -e "${YELLOW}Testing cPanel database...${NC}"
        if test_connection ${CPANEL_DB_HOST} ${CPANEL_DB_USER} ${CPANEL_DB_PASSWORD} ${CPANEL_DB_NAME} ${CPANEL_DB_PORT}; then
            echo -e "${GREEN}✓ cPanel database: Connected${NC}"
        else
            echo -e "${RED}✗ cPanel database: Connection failed${NC}"
        fi
        
        echo -e "${YELLOW}Testing VPS backup database...${NC}"
        if test_connection ${VPS_DB_HOST} ${VPS_DB_USER} ${VPS_DB_PASSWORD} ${VPS_DB_NAME} ${VPS_DB_PORT}; then
            echo -e "${GREEN}✓ VPS backup database: Connected${NC}"
        else
            echo -e "${RED}✗ VPS backup database: Connection failed${NC}"
        fi
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

