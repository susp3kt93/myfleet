const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper to generate random date within last N days
function randomDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date;
}

// Helper to generate random time for a date
function setRandomTime(date) {
    const newDate = new Date(date);
    newDate.setHours(Math.floor(Math.random() * 24));
    newDate.setMinutes(Math.floor(Math.random() * 60));
    return newDate;
}

async function main() {
    console.log('🌱 Seeding database with multi-tenant data...');

    // Clear existing data in correct order
    console.log('🧹 Clearing existing data...');
    await prisma.task.deleteMany({});
    await prisma.vehicle.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});

    // Hash password once (all users will use password123)
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
    // 2. CREATE COMPANIES (UK)
    // ============================================
    console.log('\n🏢 Creating Companies...');

    // Swift Logistics Ltd (PREMIUM)
    const swiftLogistics = await prisma.company.create({
        data: {
            name: 'Swift Logistics Ltd',
            email: 'contact@swiftlogistics.co.uk',
            phone: '+44 20 7946 0958',
            address: '45 Commercial Road, London E1 1LA',
            taxId: 'GB123456789',
            plan: 'PREMIUM',
            maxDrivers: 100,
            maxVehicles: 100,
            isActive: true,
        },
    });
    console.log('   ✓ Company created:', swiftLogistics.name, '(PREMIUM)');

    // Express Couriers Ltd (BASIC)
    const expressCouriers = await prisma.company.create({
        data: {
            name: 'Express Couriers Ltd',
            email: 'office@expresscouriers.co.uk',
            phone: '+44 121 496 0123',
            address: '78 Broad Street, Birmingham B1 2HF',
            taxId: 'GB987654321',
            plan: 'BASIC',
            maxDrivers: 20,
            maxVehicles: 20,
            isActive: true,
        },
    });
    console.log('   ✓ Company created:', expressCouriers.name, '(BASIC)');

    // ============================================
    // 3. CREATE COMPANY ADMINS
    // ============================================
    console.log('\n👔 Creating Company Admins...');

    const adminSL = await prisma.user.create({
        data: {
            personalId: 'ADMIN-SL-001',
            name: 'James Wilson',
            email: 'admin@swiftlogistics.co.uk',
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
            isActive: true,
            companyId: swiftLogistics.id,
        },
    });
    console.log('   ✓ Admin created:', adminSL.personalId, 'for', swiftLogistics.name);

    const adminEC = await prisma.user.create({
        data: {
            personalId: 'ADMIN-EC-001',
            name: 'Sarah Thompson',
            email: 'admin@expresscouriers.co.uk',
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
            isActive: true,
            companyId: expressCouriers.id,
        },
    });
    console.log('   ✓ Admin created:', adminEC.personalId, 'for', expressCouriers.name);

    // ============================================
    // 4. CREATE DRIVERS
    // ============================================
    console.log('\n🚗 Creating Drivers...');

    // Swift Logistics Drivers
    const driversSL = [
        { personalId: 'DRV-SL-001', name: 'Oliver Brown', email: 'oliver@swiftlogistics.co.uk', phone: '+44 7700 900001', rating: 4.8 },
        { personalId: 'DRV-SL-002', name: 'Emily Davies', email: 'emily@swiftlogistics.co.uk', phone: '+44 7700 900002', rating: 4.9 },
        { personalId: 'DRV-SL-003', name: 'William Taylor', email: 'william@swiftlogistics.co.uk', phone: '+44 7700 900003', rating: 4.7 },
    ];

    const driversEC = [
        { personalId: 'DRV-EC-001', name: 'Charlotte Evans', email: 'charlotte@expresscouriers.co.uk', phone: '+44 7700 900011', rating: 4.6 },
        { personalId: 'DRV-EC-002', name: 'Harry Roberts', email: 'harry@expresscouriers.co.uk', phone: '+44 7700 900012', rating: 4.8 },
        { personalId: 'DRV-EC-003', name: 'Amelia Johnson', email: 'amelia@expresscouriers.co.uk', phone: '+44 7700 900013', rating: 4.9 },
    ];

    const allDrivers = [];

    for (const driverData of driversSL) {
        const driver = await prisma.user.create({
            data: {
                ...driverData,
                password: hashedPassword,
                role: 'DRIVER',
                isActive: true,
                companyId: swiftLogistics.id,
            },
        });
        allDrivers.push(driver);
        console.log('   ✓ Driver created:', driver.personalId, '-', driver.name, '(Swift Logistics)');
    }

    for (const driverData of driversEC) {
        const driver = await prisma.user.create({
            data: {
                ...driverData,
                password: hashedPassword,
                role: 'DRIVER',
                isActive: true,
                companyId: expressCouriers.id,
            },
        });
        allDrivers.push(driver);
        console.log('   ✓ Driver created:', driver.personalId, '-', driver.name, '(Express Couriers)');
    }

    // ============================================
    // 5. CREATE VEHICLES (UK plates)
    // ============================================
    console.log('\n🚚 Creating Vehicles...');

    const vehiclesSL = [
        { plate: 'AB21 XYZ', model: 'Mercedes Sprinter', year: 2022, type: 'VAN' },
        { plate: 'CD22 ABC', model: 'Volkswagen Crafter', year: 2021, type: 'VAN' },
        { plate: 'EF23 DEF', model: 'Ford Transit', year: 2023, type: 'VAN' },
    ];

    const vehiclesEC = [
        { plate: 'GH21 GHI', model: 'Renault Master', year: 2022, type: 'VAN' },
        { plate: 'JK22 JKL', model: 'Iveco Daily', year: 2021, type: 'VAN' },
        { plate: 'LM23 MNO', model: 'Peugeot Boxer', year: 2023, type: 'VAN' },
    ];

    for (const vehicleData of vehiclesSL) {
        await prisma.vehicle.create({
            data: {
                ...vehicleData,
                companyId: swiftLogistics.id,
            },
        });
        console.log('   ✓ Vehicle created:', vehicleData.plate, 'for', swiftLogistics.name);
    }

    for (const vehicleData of vehiclesEC) {
        await prisma.vehicle.create({
            data: {
                ...vehicleData,
                companyId: expressCouriers.id,
            },
        });
        console.log('   ✓ Vehicle created:', vehicleData.plate, 'for', expressCouriers.name);
    }

    // ============================================
    // 6. CREATE TASKS (UK locations)
    // ============================================
    console.log('\n📦 Creating Tasks...');

    const taskTemplates = [
        { title: 'Parcel Delivery Westminster', description: 'Deliver packages to Westminster area offices', location: 'Westminster, London SW1' },
        { title: 'Warehouse Pickup Canary Wharf', description: 'Collect goods from Canary Wharf warehouse', location: 'Canary Wharf, London E14' },
        { title: 'Express Delivery Heathrow', description: 'Urgent package delivery to Heathrow Airport', location: 'Heathrow Airport, TW6' },
        { title: 'IT Equipment Transport', description: 'Move IT equipment between office locations', location: 'Shoreditch, London EC2A' },
        { title: 'Furniture Delivery Croydon', description: 'Residential furniture delivery and setup', location: 'Croydon, Surrey CR0' },
        { title: 'Package Collection Stratford', description: 'Collect orders from Stratford distribution centre', location: 'Stratford, London E15' },
        { title: 'Appliance Delivery', description: 'Deliver and install home appliances', location: 'Camden, London NW1' },
        { title: 'Grocery Delivery', description: 'Fresh produce delivery to supermarket', location: 'Greenwich, London SE10' },
    ];

    const allTasks = [];

    // Create tasks for Swift Logistics
    const driversForSL = allDrivers.filter(d => d.companyId === swiftLogistics.id);
    for (let i = 0; i < 15; i++) {
        const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        const status = i < 8 ? 'COMPLETED' : i < 12 ? 'ACCEPTED' : 'PENDING';
        const scheduledDate = randomDate(status === 'COMPLETED' ? 30 : 7);
        const price = 30 + Math.floor(Math.random() * 120);  // £30-£150

        const taskData = {
            title: template.title,
            description: template.description,
            location: template.location,
            scheduledDate: setRandomTime(scheduledDate),
            price: price,
            status: status,
            createdById: adminSL.id,
            companyId: swiftLogistics.id,
        };

        if (status !== 'PENDING') {
            const driver = driversForSL[Math.floor(Math.random() * driversForSL.length)];
            taskData.assignedToId = driver.id;
        }

        if (status === 'COMPLETED') {
            taskData.completedAt = setRandomTime(new Date(scheduledDate.getTime() + Math.random() * 12 * 60 * 60 * 1000));
            taskData.actualEarnings = price;
        }

        const task = await prisma.task.create({ data: taskData });
        allTasks.push(task);
    }
    console.log('   ✓ Created 15 tasks for', swiftLogistics.name);

    // Create tasks for Express Couriers
    const driversForEC = allDrivers.filter(d => d.companyId === expressCouriers.id);
    for (let i = 0; i < 12; i++) {
        const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        const status = i < 6 ? 'COMPLETED' : i < 9 ? 'ACCEPTED' : 'PENDING';
        const scheduledDate = randomDate(status === 'COMPLETED' ? 30 : 7);
        const price = 30 + Math.floor(Math.random() * 120);  // £30-£150

        const taskData = {
            title: template.title,
            description: template.description,
            location: template.location,
            scheduledDate: setRandomTime(scheduledDate),
            price: price,
            status: status,
            createdById: adminEC.id,
            companyId: expressCouriers.id,
        };

        if (status !== 'PENDING') {
            const driver = driversForEC[Math.floor(Math.random() * driversForEC.length)];
            taskData.assignedToId = driver.id;
        }

        if (status === 'COMPLETED') {
            taskData.completedAt = setRandomTime(new Date(scheduledDate.getTime() + Math.random() * 12 * 60 * 60 * 1000));
            taskData.actualEarnings = price;
        }

        const task = await prisma.task.create({ data: taskData });
        allTasks.push(task);
    }
    console.log('   ✓ Created 12 tasks for', expressCouriers.name);

    // ============================================
    // 7. UPDATE DRIVER STATISTICS
    // ============================================
    console.log('\n📊 Calculating driver statistics...');
    for (const driver of allDrivers) {
        const driverTasks = allTasks.filter(t => t.assignedToId === driver.id);
        const completedTasks = driverTasks.filter(t => t.status === 'COMPLETED');
        const totalEarnings = completedTasks.reduce((sum, t) => sum + (t.actualEarnings || 0), 0);

        await prisma.user.update({
            where: { id: driver.id },
            data: {
                totalTasks: driverTasks.length,
                completedTasks: completedTasks.length,
                totalEarnings: totalEarnings,
            },
        });

        console.log(`   ✓ ${driver.personalId}: ${completedTasks.length} completed, £${totalEarnings.toFixed(2)}`);
    }

    // ============================================
    // FINAL STATISTICS
    // ============================================
    console.log('\n📊 Database Statistics:');
    console.log(`   - Super Admin: 1`);
    console.log(`   - Companies: 2`);
    console.log(`   - Company Admins: 2`);
    console.log(`   - Drivers: ${allDrivers.length}`);
    console.log(`   - Vehicles: 6`);
    console.log(`   - Total Tasks: ${allTasks.length}`);
    console.log(`   - Completed: ${allTasks.filter(t => t.status === 'COMPLETED').length}`);
    console.log(`   - Accepted: ${allTasks.filter(t => t.status === 'ACCEPTED').length}`);
    console.log(`   - Pending: ${allTasks.filter(t => t.status === 'PENDING').length}`);

    console.log('\n✅ Multi-tenant database seeded successfully!');
    console.log('\n🔐 Login Credentials (all use password: password123):');
    console.log('\n   Super Admin:');
    console.log('   - SA001 / password123');
    console.log('\n   Company Admins:');
    console.log('   - ADMIN-SL-001 / password123 (Swift Logistics)');
    console.log('   - ADMIN-EC-001 / password123 (Express Couriers)');
    console.log('\n   Drivers (Swift Logistics):');
    console.log('   - DRV-SL-001 / password123 (Oliver Brown)');
    console.log('   - DRV-SL-002 / password123 (Emily Davies)');
    console.log('   - DRV-SL-003 / password123 (William Taylor)');
    console.log('\n   Drivers (Express Couriers):');
    console.log('   - DRV-EC-001 / password123 (Charlotte Evans)');
    console.log('   - DRV-EC-002 / password123 (Harry Roberts)');
    console.log('   - DRV-EC-003 / password123 (Amelia Johnson)');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
