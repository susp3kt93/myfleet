# MyFleet Web Application

Next.js web application for MyFleet Task & Shift Management System.

## Features

- 🔐 Secure authentication with role-based routing
- 👨‍💼 Admin dashboard with statistics
- 👥 User management (create, view, delete drivers)
- 📋 Task management (create, assign, delete tasks)
- 📊 Real-time statistics and overview
- 📱 Responsive design for all devices
- 🎨 Modern UI with Tailwind CSS

## Prerequisites

- Node.js 18+
- Backend API running

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

### 3. Start Development Server

```bash
npm run dev
```

The web app will be available at `http://localhost:3000`

## Project Structure

```
web/
├── app/
│   ├── layout.js              # Root layout with Redux
│   ├── page.js                # Login page
│   ├── globals.css            # Global styles
│   ├── dashboard/
│   │   └── page.js            # Driver dashboard
│   └── admin/
│       ├── page.js            # Admin dashboard
│       ├── users/
│       │   └── page.js        # User management
│       └── tasks/
│           └── page.js        # Task management
├── lib/
│   ├── api.js                 # API client
│   ├── store.js               # Redux store
│   ├── ReduxProvider.js       # Redux provider
│   ├── authSlice.js           # Auth state
│   ├── tasksSlice.js          # Tasks state
│   └── usersSlice.js          # Users state
└── components/                # Reusable components
```

## User Roles

### Driver
- View assigned tasks
- See task details (date, time, location, price)
- Access personal dashboard

### Admin
- Full user management
- Create and assign tasks
- View statistics
- Delete users and tasks
- Access admin dashboard

## Login Credentials

Use the sample credentials from the backend:

- **Driver**: `DRV-001` / `driver123`
- **Admin**: `ADMIN-001` / `admin123`

## Building for Production

```bash
npm run build
npm start
```

## Deployment

The app can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- Any Node.js hosting platform

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Date Utilities**: date-fns
