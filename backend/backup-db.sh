#!/bin/bash
# MyFleet Database Backup Script
# Usage: ./backup-db.sh

# Get current date and time for filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="myfleet_backup_${TIMESTAMP}.db"
DESKTOP_PATH="$HOME/Desktop/${BACKUP_NAME}"

# Copy database to Desktop
cp prisma/dev.db "$DESKTOP_PATH"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully!"
    echo "📁 Location: $DESKTOP_PATH"
    echo "📊 Size: $(ls -lh "$DESKTOP_PATH" | awk '{print $5}')"
    echo ""
    echo "To restore this backup later, run:"
    echo "cp \"$DESKTOP_PATH\" prisma/dev.db"
else
    echo "❌ Backup failed!"
    exit 1
fi
