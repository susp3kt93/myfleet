const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with VD COURIERS production data...');

    // Clear existing data in correct order
    console.log('🧹 Clearing existing data...');
    await prisma.task.deleteMany({});
    await prisma.vehicle.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});

    // Hash password (password123 for all users)
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ============================================
    // 1. CREATE SUPER ADMIN
    // ============================================
    console.log('\n👤 Creating Super Admin...');
    const superAdmin = await prisma.user.create({
        data: {
            personalId: 'SA001',
            name: 'Super Administrator',
            email: 'superadmin@myfleet.com',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true,
        },
    });
    console.log('   ✓ Super Admin created:', superAdmin.personalId);

    // ============================================
    // 2. CREATE VD COURIERS COMPANY
    // ============================================
    console.log('\n🏢 Creating VD COURIERS...');
    const vdCouriers = await prisma.company.create({
        data: {
            name: 'VD COURIERS',
            email: 'VDCOURIERS@COURIERS.CO',
            phone: '+447896767654',
            address: '160 Elsinge Road',
            taxId: '5475434689',
            plan: 'PREMIUM',
            maxDrivers: 50,
            maxVehicles: 50,
            isActive: true,
        },
    });
    console.log('   ✓ Company created:', vdCouriers.name);

    // COLETIX LTD
    const coletixLtd = await prisma.company.create({
        data: {
            name: 'COLETIX LTD',
            email: 'contact@coletix.co.uk',
            phone: '+44 20 1234 5678',
            address: 'Business Park, London',
            taxId: 'GB999888777',
            plan: 'PREMIUM',
            maxDrivers: 50,
            maxVehicles: 50,
            isActive: true,
        },
    });
    console.log('   ✓ Company created:', coletixLtd.name);

    // ============================================
    // 3. CREATE COMPANY ADMINS
    // ============================================
    console.log('\n👔 Creating Company Admin...');
    const adminVD = await prisma.user.create({
        data: {
            personalId: 'BD6622',
            name: 'Ion Catan',
            email: 'nelukatan@icloud.com',
            phone: '+37361069719',
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
            isActive: true,
            companyId: vdCouriers.id,
        },
    });
    console.log('   ✓ Admin created:', adminVD.personalId, '-', adminVD.name);

    const adminColetix = await prisma.user.create({
        data: {
            personalId: 'VD1111',
            name: 'Victor Dicu',
            email: 'victor@coletix.co.uk',
            phone: '+44 7700 123456',
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
            isActive: true,
            companyId: coletixLtd.id,
        },
    });
    console.log('   ✓ Admin created:', adminColetix.personalId, '-', adminColetix.name);

    // ============================================
    // 4. CREATE DRIVERS
    // ============================================
    console.log('\n🚗 Creating Drivers...');

    const driversData = [
        { personalId: 'BD6111', name: 'radeon', email: 'radeon@asap.com', phone: '+447633423432' },
        { personalId: 'BD6112', name: 'Viorel', email: 'viorel@asap.com', phone: '+44756332467' },
        { personalId: 'BD6113', name: 'Lilian', email: 'Lilian@asap.com', phone: '+44873928373' },
        { personalId: 'BD6114', name: 'Alexandru', email: 'alexandru@asap.com', phone: '+44645252673' },
        { personalId: 'BD6115', name: 'Ignas', email: 'ignas@asap.com', phone: '+44755434211' },
        { personalId: 'BD6116', name: 'Vadim', email: 'vadim@asap.com', phone: '+447988744738' },
        { personalId: 'BD6117', name: 'Maxim Sanduta', email: 'max@asap.com', phone: '+447968536372' },
    ];

    const drivers = {};
    for (const driverData of driversData) {
        const driver = await prisma.user.create({
            data: {
                ...driverData,
                password: hashedPassword,
                role: 'DRIVER',
                isActive: true,
                companyId: vdCouriers.id,
            },
        });
        drivers[driverData.personalId] = driver;
        console.log('   ✓ Driver created:', driver.personalId, '-', driver.name);
    }

    // ============================================
    // 5. CREATE VEHICLES
    // ============================================
    console.log('\n🚚 Creating Vehicles...');

    const vehiclesData = [
        { plate: 'VK74XVZ', model: 'E-TRANSIT', year: 2024, type: 'Van' },
        { plate: 'GJ67LRF', model: 'BOXER', year: 2017, type: 'Van' },
        { plate: 'CJ17JNZ', model: 'BOXER', year: 2017, type: 'Van' },
    ];

    for (const vehicleData of vehiclesData) {
        await prisma.vehicle.create({
            data: {
                ...vehicleData,
                companyId: vdCouriers.id,
            },
        });
        console.log('   ✓ Vehicle created:', vehicleData.plate);
    }

    // ============================================
    // 6. IMPORT TASKS FROM LOCAL DATABASE
    // ============================================
    console.log('\n📦 Importing tasks from local database...');
    console.log('   Note: This will import all 65 tasks with their original data');

    // This is a placeholder - we'll need to export and import the actual task data
    // For now, creating a few sample tasks to demonstrate the structure
    const sampleTasks = [
        {
            title: 'tour wy01',
            description: 'DELIVERY AND COLLECTING PARCEL',
            location: 'LONDON',
            scheduledDate: new Date('2024-12-29'),
            price: 180.0,
            status: 'COMPLETED',
            assignedToId: drivers['BD6111'].id,
            createdById: adminVD.id,
            companyId: vdCouriers.id,
            completedAt: new Date('2024-12-31'),
            actualEarnings: 180.0,
        },
        {
            title: 'Route WY04',
            description: 'DELIVERY AND COLLECT PARCELS FROM SHOPS AND LOCKERS',
            location: 'LONDON, WALTHAM CROSS',
            scheduledDate: new Date('2025-01-05'),
            price: 180.0,
            status: 'ACCEPTED',
            assignedToId: drivers['BD6112'].id,
            createdById: adminVD.id,
            companyId: vdCouriers.id,
        },
    ];

    for (const taskData of sampleTasks) {
        await prisma.task.create({ data: taskData });
    }
    console.log('   ✓ Sample tasks created (full import requires manual data extraction)');

    // ============================================
    // FINAL STATISTICS
    // ============================================
    const totalDrivers = Object.keys(drivers).length;
    const totalTasks = await prisma.task.count({ where: { companyId: vdCouriers.id } });

    console.log('\n📊 Database Statistics:');
    console.log(`   - Super Admin: 1`);
    console.log(`   - Companies: 2 (VD COURIERS, COLETIX LTD)`);
    console.log(`   - Company Admins: 2`);
    console.log(`   - Drivers: ${totalDrivers}`);
    console.log(`   - Vehicles: 3`);
    console.log(`   - Tasks: ${totalTasks}`);

    console.log('\n✅ VD COURIERS database seeded successfully!');
    console.log('\n🔐 Login Credentials (all use password: password123):');
    console.log('\n   Super Admin:');
    console.log('   - SA001 / password123');
    console.log('\n   Company Admins:');
    console.log('   - BD6622 / password123 (Ion Catan - VD COURIERS)');
    console.log('   - VD1111 / password123 (Victor Dicu - COLETIX LTD)');
    console.log('\n   Drivers:');
    driversData.forEach(d => {
        console.log(`   - ${d.personalId} / password123 (${d.name})`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
