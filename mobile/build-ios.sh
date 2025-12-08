#!/bin/bash

# MyFleet iOS Build Script
# This script helps you create an iOS build using EAS Build

echo "🚀 MyFleet iOS Build Helper"
echo "============================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile directory"
    exit 1
fi

echo "📱 iOS Build Options:"
echo ""
echo "1. Development Build (Internal Testing)"
echo "   - Includes development tools"
echo "   - Can use Expo Go features"
echo "   - Best for testing"
echo ""
echo "2. Preview Build (Beta Testing)"
echo "   - Production-like"
echo "   - Good for client demos"
echo "   - TestFlight compatible"
echo ""
echo "3. Production Build (App Store)"
echo "   - Optimized for App Store"
echo "   - Requires Apple Developer Program ($99/year)"
echo ""

read -p "Select build type (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔨 Creating Development Build..."
        echo ""
        echo "This will:"
        echo "✓ Build in Expo cloud (free)"
        echo "✓ Create .ipa file for installation"
        echo "✓ Take ~15-20 minutes"
        echo ""
        echo "You'll need:"
        echo "• Expo account (free - will create if needed)"
        echo "• Apple ID (free)"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            npx eas-cli build --platform ios --profile development
        fi
        ;;
    2)
        echo ""
        echo "🔨 Creating Preview Build..."
        npx eas-cli build --platform ios --profile preview
        ;;
    3)
        echo ""
        echo "🔨 Creating Production Build..."
        echo ""
        echo "⚠️  Production builds require:"
        echo "• Apple Developer Program membership ($99/year)"
        echo "• App Store Connect access"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            npx eas-cli build --platform ios --profile production
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Build command executed!"
echo ""
echo "📊 Monitor your build at: https://expo.dev/builds"
echo ""
echo "After build completes:"
echo "1. Download the .ipa file"
echo "2. Install via TestFlight or direct installation"
echo "3. Enjoy MyFleet on your iPhone! 🎉"
