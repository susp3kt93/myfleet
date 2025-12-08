/*
  Warnings:

  - You are about to drop the column `insuranceExpiry` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleModel` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vehiclePlate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `users` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "maxDrivers" INTEGER NOT NULL DEFAULT 5,
    "maxVehicles" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "capacity" TEXT,
    "lastService" DATETIME,
    "nextService" DATETIME,
    "insuranceExpiry" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vehicles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vehicles_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "fromAdmin" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_messages" ("content", "createdAt", "fromAdmin", "id", "isRead", "userId") SELECT "content", "createdAt", "fromAdmin", "id", "isRead", "userId" FROM "messages";
DROP TABLE "messages";
ALTER TABLE "new_messages" RENAME TO "messages";
CREATE TABLE "new_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_notifications" ("createdAt", "data", "id", "isRead", "message", "readAt", "title", "userId") SELECT "createdAt", "data", "id", "isRead", "message", "readAt", "title", "userId" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" DATETIME NOT NULL,
    "scheduledTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "price" REAL NOT NULL,
    "location" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "notes" TEXT,
    "completedAt" DATETIME,
    "actualEarnings" REAL,
    "driverNotes" TEXT,
    "rating" REAL,
    "companyId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("actualEarnings", "assignedToId", "completedAt", "createdAt", "createdById", "description", "driverNotes", "id", "latitude", "location", "longitude", "notes", "price", "rating", "scheduledDate", "scheduledTime", "status", "title", "updatedAt") SELECT "actualEarnings", "assignedToId", "completedAt", "createdAt", "createdById", "description", "driverNotes", "id", "latitude", "location", "longitude", "notes", "price", "rating", "scheduledDate", "scheduledTime", "status", "title", "updatedAt" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personalId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'DRIVER',
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" DATETIME,
    "preferredZones" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'ro',
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "pushToken" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_users" ("completedTasks", "createdAt", "darkMode", "email", "emailNotifications", "id", "isActive", "language", "licenseExpiry", "licenseNumber", "name", "notificationsEnabled", "password", "personalId", "phone", "photoUrl", "preferredZones", "pushNotifications", "pushToken", "rating", "role", "totalEarnings", "totalTasks", "updatedAt") SELECT "completedTasks", "createdAt", "darkMode", "email", "emailNotifications", "id", "isActive", "language", "licenseExpiry", "licenseNumber", "name", "notificationsEnabled", "password", "personalId", "phone", "photoUrl", "preferredZones", "pushNotifications", "pushToken", "rating", "role", "totalEarnings", "totalTasks", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_personalId_key" ON "users"("personalId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "companies"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_assignedToId_key" ON "vehicles"("assignedToId");
