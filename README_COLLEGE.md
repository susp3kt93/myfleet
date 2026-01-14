# MyFleet Project

## Overview
MyFleet is a comprehensive fleet management solution comprising a backend API, a web administration dashboard, and a mobile application for drivers.

## Project Structure
- `backend/`: Node.js/Express API with Prisma and PostgreSQL.
- `web/`: Next.js Web Dashboard for Administrators.
- `mobile/`: React Native (Expo) Mobile App for Drivers.
- `docs/`: Project documentation and diagrams.

## Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or via URL)
- Expo Go (for running mobile app)

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
# Ensure .env is configured with your DATABASE_URL
npx prisma generate
npx prisma db push # or npx prisma migrate dev
npm run dev
```
Server runs at: `http://localhost:3002`

### 2. Web App Setup
```bash
cd web
npm install
# Ensure .env.local points to http://localhost:3002/api
npm run dev
```
Web Dashboard runs at: `http://localhost:3000`

### 3. Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with Expo Go app on your phone.

## Diagrams
See `docs/` folder for Entity Relationship Diagram (ERD) and Flow Diagram.

## Features Implemented
- **Admin Dashboard**: Manage drivers, vehicles, tasks, and view reports.
- **Driver App**: Accept/complete tasks, view earnings, request time off.
- **Notifications**: Push notifications for task updates.
- **Invoice Download**: Drivers can download PDF earnings reports.
- **Multi-tenancy**: Support for multiple companies.
