-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "actualEarnings" REAL;
ALTER TABLE "tasks" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "tasks" ADD COLUMN "driverNotes" TEXT;
ALTER TABLE "tasks" ADD COLUMN "rating" REAL;

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "fromAdmin" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "vehicleType" TEXT,
    "vehiclePlate" TEXT,
    "vehicleModel" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" DATETIME,
    "insuranceExpiry" DATETIME,
    "preferredZones" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'ro',
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "isActive", "name", "password", "personalId", "phone", "photoUrl", "role", "updatedAt") SELECT "createdAt", "email", "id", "isActive", "name", "password", "personalId", "phone", "photoUrl", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_personalId_key" ON "users"("personalId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
