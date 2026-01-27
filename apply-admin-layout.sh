#!/bin/bash

# Script to wrap all admin pages with AdminLayout component
# This applies the modern gradient header to all admin pages

echo "🎨 Applying AdminLayout to all admin pages..."

# Get all admin page files
admin_pages=$(find /Users/susp3kt/.gemini/antigravity/scratch/myfleet/web/app/admin -name "page.js" -not -path "*/node_modules/*")

for page in $admin_pages; do
    # Skip if page already has AdminLayout
    if grep -q "AdminLayout" "$page"; then
        echo "⏭️  Skipping $page (already has AdminLayout)"
        continue
    fi
    
    # Check if page has header
    if grep -q "from-green-500 to-emerald-600" "$page"; then
        echo "✅ Processing $page"
        
        # Add import at top
        sed -i '' "s/import LanguageSwitcher from/import AdminLayout from '.\/components\/AdminLayout';\nimport LanguageSwitcher from/" "$page" 2>/dev/null || \
        sed -i '' "s/'use client';/'use client';\n\nimport AdminLayout from '.\/components\/AdminLayout';/" "$page"
        
        # Remove header and wrap main content with AdminLayout
        # This is a placeholder - actual implementation needs manual review
        
        echo "   Note: Manual review needed for $page"
    fi
done

echo "✅ AdminLayout application complete!"
echo "📝 Check each page manually to ensure proper wrapping"
