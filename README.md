# MyFleet - Cross-Platform Task & Shift Management System

A comprehensive fleet management application for drivers and administrators, available on iOS, Android, and Web platforms.

## 🚀 Features

### For Drivers
- ✅ Secure login with personal ID
- 📅 Weekly calendar view of assigned tasks
- 💰 View task prices and details
- ✔️ Accept or reject tasks
- 📱 Mobile apps for iOS and Android
- 🌐 Web access from any browser

### For Administrators
- 👥 Complete user management
- 📋 Create and assign tasks to drivers
- 📊 Dashboard with real-time statistics
- 🗑️ Manage users and tasks
- 💵 Set prices for each task
- 🌐 Web-based admin panel

## 📦 Project Structure

```
myfleet/
├── backend/          # Node.js/Express API
├── mobile/           # React Native mobile app
├── web/              # Next.js web application
└── shared/           # Shared types and constants
```

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, PostgreSQL, Prisma, JWT
- **Mobile**: React Native, Expo, Redux Toolkit
- **Web**: Next.js 14, Tailwind CSS, Redux Toolkit
- **Database**: PostgreSQL

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Expo CLI (for mobile development)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Backend runs on `http://localhost:3001`

### 2. Mobile App Setup

```bash
cd mobile
npm install
npm start
# Press 'i' for iOS or 'a' for Android
```

**Note**: Update `src/services/api.js` with your computer's IP address when testing on physical devices.

### 3. Web App Setup

```bash
cd web
npm install
npm run dev
```

Web app runs on `http://localhost:3000`

## 🔑 Demo Credentials

After running the seed script:

- **Admin**: `ADMIN-001` / `admin123`
- **Driver 1**: `DRV-001` / `driver123`
- **Driver 2**: `DRV-002` / `driver123`
- **Driver 3**: `DRV-003` / `driver123`

## 📱 Mobile App Features

- 🎨 Beautiful splash screen with 3-second auto-navigation
- 🔐 Secure authentication with encrypted storage
- 📅 Interactive weekly calendar
- 📋 Task cards with accept/reject buttons
- 🔄 Pull-to-refresh functionality
- 📱 Native iOS and Android support

## 🌐 Web App Features

- 🎯 Role-based routing (Admin/Driver)
- 📊 Admin dashboard with statistics
- 👥 User management interface
- 📋 Task creation and assignment
- 📱 Fully responsive design
- 🎨 Modern UI with Tailwind CSS

## 📖 Documentation

Each component has its own README:
- [Backend Documentation](backend/README.md)
- [Mobile App Documentation](mobile/README.md)
- [Web App Documentation](web/README.md)

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Secure token storage (SecureStore on mobile, localStorage on web)
- Role-based access control
- Protected API endpoints

## 🚀 Deployment

### Backend
- Deploy to Railway, Render, or AWS
- Set up PostgreSQL database
- Configure environment variables

### Mobile
- Use Expo EAS Build for iOS and Android
- Submit to App Store and Google Play

### Web
- Deploy to Vercel (recommended)
- Or use Netlify, AWS Amplify

## 🛣️ Roadmap

Future enhancements:
- [ ] Google Maps integration
- [ ] Push notifications
- [ ] Real-time updates with WebSockets
- [ ] Task history and analytics
- [ ] Earnings dashboard
- [ ] Multi-language support (Romanian/English)
- [ ] Dark mode
- [ ] Offline mode
- [ ] Document upload
- [ ] Chat/messaging system

## 📄 License

MIT

## 👥 Support

For support, contact your system administrator.

---

Built with ❤️ for fleet management
