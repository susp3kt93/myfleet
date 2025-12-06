# MyFleet Backend API

Backend API for MyFleet Task & Shift Management System.

## Features

- 🔐 JWT Authentication
- 👥 User Management (Admin)
- 📋 Task Management with Accept/Reject
- 🔒 Role-based Access Control (Admin/Driver)
- 📊 PostgreSQL Database with Prisma ORM

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update `DATABASE_URL` with your PostgreSQL connection string.

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run seed
```

### 4. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with personalId and password
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Users (Admin Only)

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tasks

- `GET /api/tasks` - Get tasks (filtered by role)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task (admin only)
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/accept` - Accept task
- `POST /api/tasks/:id/reject` - Reject task
- `DELETE /api/tasks/:id` - Delete task (admin only)

## Sample Login Credentials

After running the seed script:

- **Admin**: `ADMIN-001` / `admin123`
- **Driver 1**: `DRV-001` / `driver123`
- **Driver 2**: `DRV-002` / `driver123`
- **Driver 3**: `DRV-003` / `driver123`

## Database Schema

### User Model
- Personal ID (unique identifier)
- Password (hashed)
- Name, Email, Phone
- Role (ADMIN/DRIVER)
- Photo URL
- Active status

### Task Model
- Title, Description
- Scheduled Date & Time
- Status (PENDING/ACCEPTED/REJECTED/IN_PROGRESS/COMPLETED/CANCELLED)
- Price
- Location, Notes
- Assigned Driver
- Created By (Admin)

## Development Tools

```bash
# Open Prisma Studio (database GUI)
npm run prisma:studio

# View API health
curl http://localhost:3001/health
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Password Hashing**: bcryptjs
