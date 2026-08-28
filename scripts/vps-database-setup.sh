#!/bin/bash

# VPS Database Setup Script
# This script installs MySQL/MariaDB on VPS and sets up backup database

set -e

echo "=========================================="
echo "VPS Database Setup for Axia HR Advisory"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration
DB_NAME="axia_backup"
DB_USER="axia_backup_user"
DB_PASSWORD=$(openssl rand -base64 32)
BACKUP_DIR="/var/backups/axia-db"
LOG_DIR="/var/log/axia-db"

echo -e "${GREEN}Step 1: Installing MySQL/MariaDB...${NC}"

# Detect OS and install MySQL/MariaDB
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}Cannot detect OS${NC}"
    exit 1
fi

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update
    apt-get install -y mariadb-server mariadb-client
    systemctl enable mariadb
    systemctl start mariadb
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
    yum install -y mariadb-server mariadb
    systemctl enable mariadb
    systemctl start mariadb
else
    echo -e "${RED}Unsupported OS: $OS${NC}"
    exit 1
fi

echo -e "${GREEN}Step 2: Securing MySQL installation...${NC}"

# Run mysql_secure_installation non-interactively
mysql -e "DELETE FROM mysql.user WHERE User='';"
mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
mysql -e "DROP DATABASE IF EXISTS test;"
mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
mysql -e "FLUSH PRIVILEGES;"

echo -e "${GREEN}Step 3: Creating backup database and user...${NC}"

# Create database
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create user and grant privileges
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Allow remote connections (optional, for testing)
read -p "Allow remote connections? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';"
    mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';"
    mysql -e "FLUSH PRIVILEGES;"
    
    # Configure MySQL to listen on all interfaces
    sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf 2>/dev/null || \
    sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/my.cnf 2>/dev/null || \
    echo "bind-address = 0.0.0.0" >> /etc/my.cnf
    
    systemctl restart mariadb
    echo -e "${YELLOW}Warning: Remote connections enabled. Ensure firewall is configured.${NC}"
fi

echo -e "${GREEN}Step 4: Creating backup directories...${NC}"
mkdir -p ${BACKUP_DIR}
mkdir -p ${LOG_DIR}
chmod 755 ${BACKUP_DIR}
chmod 755 ${LOG_DIR}

echo -e "${GREEN}Step 5: Installing backup tools...${NC}"
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get install -y mysqldump mysql-client
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
    yum install -y mariadb
fi

echo -e "${GREEN}Step 6: Saving database credentials...${NC}"
cat > /root/axia-db-backup-credentials.txt << EOF
==========================================
Axia HR Advisory - Backup Database Credentials
==========================================
Database Name: ${DB_NAME}
Database User: ${DB_USER}
Database Password: ${DB_PASSWORD}
Database Host: localhost (or VPS IP: $(hostname -I | awk '{print $1}'))
Database Port: 3306

IMPORTANT: Keep this file secure!
==========================================
EOF

chmod 600 /root/axia-db-backup-credentials.txt

echo -e "${GREEN}=========================================="
echo -e "Setup Complete!"
echo -e "==========================================${NC}"
echo -e "Database Name: ${GREEN}${DB_NAME}${NC}"
echo -e "Database User: ${GREEN}${DB_USER}${NC}"
echo -e "Database Password: ${GREEN}${DB_PASSWORD}${NC}"
echo -e "Backup Directory: ${GREEN}${BACKUP_DIR}${NC}"
echo -e "Log Directory: ${GREEN}${LOG_DIR}${NC}"
echo ""
echo -e "${YELLOW}Credentials saved to: /root/axia-db-backup-credentials.txt${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Run the backup script to sync data from cPanel"
echo "2. Set up cron job for nightly backups"
echo "3. Configure application to use backup database when needed"
echo ""
echo -e "${GREEN}To test connection:${NC}"
echo "mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME}"

