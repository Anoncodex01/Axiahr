# Database Backup Scripts

## Quick Start

### 1. Initial Setup (One-time)
```bash
sudo ./vps-database-setup.sh
```
This installs MySQL on VPS and creates backup database.

### 2. Manual Backup Test
```bash
sudo ./sync-database-backup.sh
```
This syncs data from cPanel to VPS backup database.

### 3. Setup Automated Backups
```bash
sudo ./setup-cron-backup.sh
```
This creates a cron job for nightly backups at 2:00 AM.

### 4. Switch Databases
```bash
sudo ./switch-database.sh
```
Interactive menu to switch between cPanel and VPS backup database.

## Scripts Overview

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `vps-database-setup.sh` | Install MySQL and create backup database | First time setup only |
| `sync-database-backup.sh` | Backup and sync from cPanel to VPS | Manual backup or cron job |
| `switch-database.sh` | Switch application database | When cPanel is down |
| `setup-cron-backup.sh` | Setup automated nightly backups | After initial setup |

## File Locations

- **Backup files:** `/var/backups/axia-db/`
- **Log files:** `/var/log/axia-db/`
- **Credentials:** `/root/axia-db-backup-credentials.txt`
- **Application:** `/var/www/axia-nextjs/`

## Quick Commands

```bash
# View latest backup
ls -lh /var/backups/axia-db/ | tail -5

# View backup logs
tail -f /var/log/axia-db/backup-*.log

# Test cPanel connection
mysql -h 192.250.229.162 -u nisapoti_Axia -p nisapoti_Axia

# Test VPS backup connection
mysql -u axia_backup_user -p axia_backup

# View cron jobs
crontab -l
```

