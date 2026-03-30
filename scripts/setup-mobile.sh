#!/bin/bash
# PestFlow Pro — Mobile App Setup Script
# Run this to scaffold the Capacitor iOS/Android project.
#
# Prerequisites:
# - Node.js 18+
# - For iOS: macOS + Xcode 15+
# - For Android: Android Studio + JDK 17
#
# Usage:
#   chmod +x scripts/setup-mobile.sh
#   ./scripts/setup-mobile.sh

set -e

echo "🔧 Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/push-notifications

echo "📱 Building web app..."
npm run build

echo "📦 Initializing Capacitor..."
npx cap init "PestFlow Pro" com.pestflowpro.app --web-dir dist 2>/dev/null || true

echo "🍎 Adding iOS platform..."
npx cap add ios 2>/dev/null || echo "iOS already added or not on macOS"

echo "🤖 Adding Android platform..."
npx cap add android 2>/dev/null || echo "Android already added"

echo "🔄 Syncing web assets to native projects..."
npx cap sync

echo ""
echo "✅ Mobile scaffold complete!"
echo ""
echo "To run on iOS:     npx cap open ios"
echo "To run on Android:  npx cap open android"
echo "To live reload:     npx cap run ios --livereload --external"
echo ""
echo "Before release:"
echo "  1. Replace app icons in ios/App/App/Assets.xcassets and android/app/src/main/res"
echo "  2. Update capacitor.config.ts (remove dev server URL)"
echo "  3. Run: npm run build && npx cap sync"
