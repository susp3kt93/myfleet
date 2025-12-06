#!/bin/bash
# MyFleet Full Project Backup Script
# Usage: ./backup-project.sh

# Get current date and time for filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="myfleet_full_backup_${TIMESTAMP}.tar.gz"
DESKTOP_PATH="$HOME/Desktop/${BACKUP_NAME}"
PROJECT_DIR="/Users/susp3kt/.gemini/antigravity/scratch/myfleet"

echo "🔄 Creating full project backup..."
echo "📁 Source: $PROJECT_DIR"

# Create compressed archive excluding unnecessary folders
tar -czf "$DESKTOP_PATH" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  -C "$(dirname "$PROJECT_DIR")" \
  "$(basename "$PROJECT_DIR")"

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(ls -lh "$DESKTOP_PATH" | awk '{print $5}')
    echo ""
    echo "✅ Backup created successfully!"
    echo "📁 Location: $DESKTOP_PATH"
    echo "📊 Size: $BACKUP_SIZE"
    echo ""
    echo "ℹ️  Excluded folders: node_modules, .next, .git"
    echo ""
    echo "To restore this backup:"
    echo "  cd ~/Desktop"
    echo "  tar -xzf \"$(basename "$DESKTOP_PATH")\""
    echo "  cd myfleet/backend && npm install"
    echo "  cd ../web && npm install"
else
    echo "❌ Backup failed!"
    exit 1
fi
