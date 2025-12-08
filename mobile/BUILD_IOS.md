# 📱 MyFleet iOS Build Guide

This guide will help you create and install the MyFleet iOS application on your iPhone.

## 🚀 Quick Start - EAS Build

The fastest way to get a standalone iOS app is using **EAS Build** (Expo Application Services).

### Prerequisites

1. **Expo Account** (free)
   - Sign up at: https://expo.dev
   - OR create during build process

2. **Apple ID** (free for development)
   - Any Apple ID works for testing
   - $99/year Apple Developer Program needed for App Store distribution

3. **iPhone for Testing**
   - iOS 13.0 or later

---

## 📋 Step-by-Step Build Process

### Method 1: Using the Interactive Script (RECOMMENDED)

```bash
cd /Users/susp3kt/.gemini/antigravity/scratch/myfleet/mobile
npm run build:ios
```

This will guide you through the build options interactively.

### Method 2: Direct Commands

```bash
# Development Build (recommended for first build)
npm run build:ios:dev

# Preview Build (for demos/beta testing)
npm run build:ios:preview

# Production Build (for App Store)
npm run build:ios:prod
```

---

## 🔧 First Time Setup

### 1. Login to Expo

```bash
npx eas-cli login
```

Enter your Expo credentials or create a new account.

### 2. Configure Apple Account

During the first build, EAS will ask you to configure your Apple credentials:

```bash
? What would you like your iOS bundle identifier to be?
> com.myfleet.app (default, or customize)

? Generate a new Apple Distribution Certificate? 
> Yes (recommended)

? Generate a new Apple Provisioning Profile?
> Yes (recommended)
```

**Note:** EAS will handle certificate generation automatically!

---

## 🏗️ Build Process

### 1. Start the Build

```bash
npm run build:ios:dev
```

### 2. Monitor Progress

The build happens in Expo's cloud servers (free for development builds).

- **Build time:** ~15-20 minutes
- **Monitor at:** https://expo.dev/builds
- **Get notifications** when build completes

### 3. Download the .ipa File

Once complete:
1. Visit https://expo.dev/builds
2. Find your completed build
3. Click **Download** to get the .ipa file

---

## 📲 Installing on iPhone

### Option A: TestFlight (Recommended for Multiple Devices)

1. **Upload to App Store Connect**
   ```bash
   npx eas-cli submit --platform ios --profile preview
   ```

2. **Add Testers in App Store Connect**
   - Go to App Store Connect
   - Select your app → TestFlight
   - Add internal/external testers

3. **Install from TestFlight**
   - Testers receive email invitation
   - Install TestFlight app from App Store
   - Install MyFleet from TestFlight

### Option B: Direct Installation (Single Device, Quick)

1. **Open the download link on iPhone** (sent via email or from expo.dev)
   
2. **Install the Profile**
   - Safari will prompt to install
   - Settings → Profile Downloaded → Install

3. **Trust the Developer**
   - Settings → General → Device Management
   - Trust the certificate

4. **Launch MyFleet** 🎉

---

## 🔐 Current Configuration

### Build Profiles

The project includes three build profiles in `eas.json`:

#### 1. Development
```json
{
  "developmentClient": true,
  "distribution": "internal",
  "bundleIdentifier": "com.myfleet.app"
}
```
- Best for: Testing and development
- Includes: Development tools and debugging
- Distribution: Internal only

#### 2. Preview
```json
{
  "distribution": "internal",
  "bundleIdentifier": "com.myfleet.app"
}
```
- Best for: Client demos and beta testing
- Production-like build
- Can use TestFlight

#### 3. Production
```json
{
  "bundleIdentifier": "com.myfleet.app"
}
```
- Best for: App Store submission
- Fully optimized
- Requires Apple Developer Program

---

## 🌐 Backend Configuration

**IMPORTANT:** The mobile app needs to connect to your backend API.

### For Local Testing (Development)

Update the API URL in the app to point to your local backend:

```javascript
// mobile/src/services/api.js
const API_URL = 'http://YOUR_LOCAL_IP:3002/api';
```

Example:
```javascript
const API_URL = 'http://192.168.1.100:3002/api';
```

**Note:** Use your Mac's local IP address (not localhost) so the iPhone can reach it.

### For Production/Demo

Deploy your backend to a cloud service:
- Heroku
- AWS
- DigitalOcean
- Railway
- Render

Then update the API URL to the production URL.

---

## 📊 Build Troubleshooting

### Build Failed: "Invalid bundle identifier"

**Solution:** The bundle identifier must be unique. Update in `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourname.myfleet"
    }
  }
}
```

### Build Failed: "Missing credentials"

**Solution:** Run credentials configuration manually:

```bash
npx eas-cli credentials
```

Select "iOS" → "Set up credentials from scratch"

### App Crashes on Launch

**Check:**
1. Backend API is accessible from the iPhone
2. API URL is correct (not localhost)
3. Check logs: `npx expo start` then shake device → Open Debugger

### Certificate Issues

**Solution:** Let EAS regenerate:

```bash
npx eas-cli credentials
# Select: Manage credentials
# Delete old credentials
# Build again - will create new ones
```

---

## 🚦 Build Status Indicators

When running EAS build, you'll see:

- 🟡 **Queued** - Waiting for build server
- 🔵 **In Progress** - Building...
- 🟢 **Finished** - Success! Download ready
- 🔴 **Errored** - Build failed (check logs)

---

## 💡 Pro Tips

### 1. Speed Up Builds
```bash
# Use --local flag to build on your Mac (requires Xcode)
npx eas-cli build --platform ios --profile development --local
```

### 2. Auto-Submit to TestFlight
```bash
# After build, automatically submit
npx eas-cli build --platform ios --profile production --auto-submit
```

### 3. Check Build Logs
```bash
npx eas-cli build:list
npx eas-cli build:view [BUILD_ID]
```

### 4. Clear Build Cache
```bash
npx eas-cli build --platform ios --profile development --clear-cache
```

---

## 📱 Testing the App

### Login Credentials (Multi-Tenant)

After build, test with these credentials:

**Super Admin:**
- ID: `SA001`
- Password: `password123`

**Company A Admin:**
- ID: `ADM-A001`
- Password: `password123`

**Company A Driver:**
- ID: `DRV-A001`
- Password: `password123`

**Company B Admin:**
- ID: `ADM-B001`
- Password: `password123`

**Company B Driver:**
- ID: `DRV-B001`
- Password: `password123`

---

## 🔄 Updating the App

When you make changes and want to create a new build:

1. Update version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1"
     }
   }
   ```

2. Run build again:
   ```bash
   npm run build:ios:dev
   ```

3. Install the new build on your iPhone

---

## 📚 Additional Resources

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **iOS Credentials:** https://docs.expo.dev/app-signing/app-credentials/
- **TestFlight Guide:** https://developer.apple.com/testflight/
- **Expo DevTools:** https://docs.expo.dev/workflow/debugging/

---

## ✅ Success Checklist

- [ ] Expo account created
- [ ] EAS CLI configured
- [ ] eas.json created
- [ ] Build started successfully
- [ ] Build completed (check expo.dev)
- [ ] .ipa file downloaded
- [ ] App installed on iPhone
- [ ] Backend API accessible
- [ ] Login successful
- [ ] App running smoothly 🎉

---

## 🆘 Need Help?

If you encounter issues:

1. **Check build logs** at https://expo.dev/builds
2. **Review Expo docs:** https://docs.expo.dev
3. **Check Apple Developer docs** for certificate issues
4. **Verify backend is running** and accessible

---

**Happy Building! 🚀**

Your MyFleet iOS app is ready to go!
