// Migration script to move data from SQLite backup to PostgreSQL
const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const SQLITE_PATH = '/tmp/myfleet_restore/backend/prisma/dev.db';

const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Starting migration from SQLite to PostgreSQL...');

    const sqlite = new Database(SQLITE_PATH, { readonly: true });

    try {
        // Clear existing data
        console.log('🧹 Clearing existing data in PostgreSQL...');
        await prisma.notification.deleteMany({});
        await prisma.message.deleteMany({});
        await prisma.task.deleteMany({});
        await prisma.vehicle.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.company.deleteMany({});

        // Migrate companies
        console.log('\n🏢 Migrating companies...');
        const companies = sqlite.prepare('SELECT * FROM companies').all();
        for (const company of companies) {
            await prisma.company.create({
                data: {
                    id: company.id,
                    name: company.name,
                    email: company.email,
                    phone: company.phone,
                    address: company.address,
                    taxId: company.taxId,
                    logo: company.logo,
                    isActive: Boolean(company.isActive),
                    plan: company.plan,
                    maxDrivers: company.maxDrivers,
                    maxVehicles: company.maxVehicles,
                    createdAt: new Date(company.createdAt),
                    updatedAt: new Date(company.updatedAt),
                }
            });
            console.log(`   ✓ ${company.name}`);
        }

        // Migrate users
        console.log('\n👤 Migrating users...');
        const users = sqlite.prepare('SELECT * FROM users').all();
        for (const user of users) {
            await prisma.user.create({
                data: {
                    id: user.id,
                    personalId: user.personalId,
                    password: user.password,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    photoUrl: user.photoUrl,
                    isActive: Boolean(user.isActive),
                    companyId: user.companyId || null,
                    licenseNumber: user.licenseNumber,
                    licenseExpiry: user.licenseExpiry ? new Date(user.licenseExpiry) : null,
                    preferredZones: user.preferredZones,
                    notificationsEnabled: Boolean(user.notificationsEnabled),
                    language: user.language || 'ro',
                    darkMode: Boolean(user.darkMode),
                    pushToken: user.pushToken,
                    emailNotifications: Boolean(user.emailNotifications),
                    pushNotifications: Boolean(user.pushNotifications),
                    totalEarnings: user.totalEarnings || 0,
                    totalTasks: user.totalTasks || 0,
                    completedTasks: user.completedTasks || 0,
                    rating: user.rating,
                    createdAt: new Date(user.createdAt),
                    updatedAt: new Date(user.updatedAt),
                }
            });
            console.log(`   ✓ ${user.personalId} - ${user.name} (${user.role})`);
        }

        // Migrate vehicles
        console.log('\n🚗 Migrating vehicles...');
        const vehicles = sqlite.prepare('SELECT * FROM vehicles').all();
        for (const vehicle of vehicles) {
            await prisma.vehicle.create({
                data: {
                    id: vehicle.id,
                    type: vehicle.type,
                    plate: vehicle.plate,
                    model: vehicle.model,
                    year: vehicle.year,
                    capacity: vehicle.capacity,
                    lastService: vehicle.lastService ? new Date(vehicle.lastService) : null,
                    nextService: vehicle.nextService ? new Date(vehicle.nextService) : null,
                    insuranceExpiry: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null,
                    isActive: Boolean(vehicle.isActive),
                    companyId: vehicle.companyId,
                    assignedToId: vehicle.assignedToId || null,
                    createdAt: new Date(vehicle.createdAt),
                    updatedAt: new Date(vehicle.updatedAt),
                }
            });
            console.log(`   ✓ ${vehicle.plate}`);
        }

        // Migrate tasks
        console.log('\n📦 Migrating tasks...');
        const tasks = sqlite.prepare('SELECT * FROM tasks').all();
        for (const task of tasks) {
            await prisma.task.create({
                data: {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    scheduledDate: new Date(task.scheduledDate),
                    scheduledTime: task.scheduledTime,
                    status: task.status,
                    price: task.price,
                    location: task.location,
                    latitude: task.latitude,
                    longitude: task.longitude,
                    notes: task.notes,
                    completedAt: task.completedAt ? new Date(task.completedAt) : null,
                    actualEarnings: task.actualEarnings,
                    driverNotes: task.driverNotes,
                    rating: task.rating,
                    companyId: task.companyId,
                    assignedToId: task.assignedToId || null,
                    createdById: task.createdById,
                    createdAt: new Date(task.createdAt),
                    updatedAt: new Date(task.updatedAt),
                }
            });
        }
        console.log(`   ✓ Migrated ${tasks.length} tasks`);

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Companies: ${companies.length}`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Vehicles: ${vehicles.length}`);
        console.log(`   - Tasks: ${tasks.length}`);

    } finally {
        sqlite.close();
        await prisma.$disconnect();
    }
}

migrate().catch(console.error);
