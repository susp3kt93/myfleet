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
    "pushToken" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("completedTasks", "createdAt", "darkMode", "email", "id", "insuranceExpiry", "isActive", "language", "licenseExpiry", "licenseNumber", "name", "notificationsEnabled", "password", "personalId", "phone", "photoUrl", "preferredZones", "pushToken", "rating", "role", "totalEarnings", "totalTasks", "updatedAt", "vehicleModel", "vehiclePlate", "vehicleType") SELECT "completedTasks", "createdAt", "darkMode", "email", "id", "insuranceExpiry", "isActive", "language", "licenseExpiry", "licenseNumber", "name", "notificationsEnabled", "password", "personalId", "phone", "photoUrl", "preferredZones", "pushToken", "rating", "role", "totalEarnings", "totalTasks", "updatedAt", "vehicleModel", "vehiclePlate", "vehicleType" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_personalId_key" ON "users"("personalId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
