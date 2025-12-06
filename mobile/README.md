# MyFleet Mobile App

React Native mobile application for MyFleet Task & Shift Management System.

## Features

- 🎨 Beautiful splash screen with auto-navigation
- 🔐 Secure authentication with encrypted storage
- 📅 Weekly calendar view of tasks
- ✅ Accept/Reject tasks
- 💰 View task prices and details
- 🔄 Pull-to-refresh functionality
- 📱 iOS and Android support

## Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

## Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Start Development Server

```bash
npm start
```

This will open Expo Dev Tools. From there you can:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your phone

### 3. Configure API Endpoint

Edit `src/services/api.js` and update the `API_URL`:

```javascript
const API_URL = 'http://YOUR_IP:3001/api'; // Replace with your backend IP
```

**Note**: Use your computer's local IP address (not localhost) when testing on a physical device.

## Project Structure

```
mobile/
├── App.js                      # Main app component
├── src/
│   ├── screens/
│   │   ├── SplashScreen.js    # 3-second splash screen
│   │   ├── LoginScreen.js     # Login with Personal ID
│   │   └── MainScreen.js      # Main dashboard
│   ├── components/
│   │   ├── TaskCard.js        # Task display with actions
│   │   └── WeeklyCalendar.js  # 7-day calendar view
│   ├── store/
│   │   ├── index.js           # Redux store
│   │   ├── authSlice.js       # Authentication state
│   │   └── tasksSlice.js      # Tasks state
│   └── services/
│       └── api.js             # API client
```

## Login Credentials

Use the sample credentials from the backend:

- **Driver 1**: `DRV-001` / `driver123`
- **Driver 2**: `DRV-002` / `driver123`
- **Driver 3**: `DRV-003` / `driver123`
- **Admin**: `ADMIN-001` / `admin123`

## Building for Production

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit
- **UI Components**: React Native Paper
- **Secure Storage**: Expo SecureStore
- **HTTP Client**: Axios
- **Date Utilities**: date-fns
