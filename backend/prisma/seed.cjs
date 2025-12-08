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
    // 2. CREATE COMPANIES
    // ============================================
    console.log('\n🏢 Creating Companies...');

    // Transport Express SRL (PREMIUM)
    const transportExpress = await prisma.company.create({
        data: {
            name: 'Transport Express SRL',
            email: 'contact@transport-express.ro',
            phone: '+40212345678',
            address: 'Str. Transportului 15, Sector 1, București',
            taxId: 'RO12345678',
            plan: 'PREMIUM',
            maxDrivers: 100,
            maxVehicles: 100,
            isActive: true,
        },
    });
    console.log('   ✓ Company created:', transportExpress.name, '(PREMIUM)');

    // Logistics Pro SRL (BASIC)
    const logisticsPro = await prisma.company.create({
        data: {
            name: 'Logistics Pro SRL',
            email: 'office@logistics-pro.ro',
            phone: '+40213456789',
            address: 'Bd. Logisticii 42, Sector 2, București',
            taxId: 'RO87654321',
            plan: 'BASIC',
            maxDrivers: 20,
            maxVehicles: 20,
            isActive: true,
        },
    });
    console.log('   ✓ Company created:', logisticsPro.name, '(BASIC)');

    // ============================================
    // 3. CREATE COMPANY ADMINS
    // ============================================
    console.log('\n👔 Creating Company Admins...');

    const adminTE = await prisma.user.create({
        data: {
            personalId: 'ADMIN-TE-001',
            name: 'Alexandru Popescu',
            email: 'admin@transport-express.ro',
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
            isActive: true,
            companyId: transportExpress.id,
        },
    });
    console.log('   ✓ Admin created:', adminTE.personalId, 'for', transportExpress.name);

    const adminLP = await prisma.user.create({
        data: {
            personalId: 'ADMIN-LP-001',
            name: 'Maria Ionescu',
            email: 'admin@logistics-pro.ro',
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
            isActive: true,
            companyId: logisticsPro.id,
        },
    });
    console.log('   ✓ Admin created:', adminLP.personalId, 'for', logisticsPro.name);

    // ============================================
    // 4. CREATE DRIVERS
    // ============================================
    console.log('\n🚗 Creating Drivers...');

    // Transport Express Drivers
    const driversTE = [
        { personalId: 'DRV-TE-001', name: 'Ion Popescu', email: 'ion@transport-express.ro', phone: '+40721111001', rating: 4.8 },
        { personalId: 'DRV-TE-002', name: 'Maria Dumitrescu', email: 'maria@transport-express.ro', phone: '+40721111002', rating: 4.9 },
        { personalId: 'DRV-TE-003', name: 'Andrei Vasile', email: 'andrei@transport-express.ro', phone: '+40721111003', rating: 4.7 },
    ];

    const driversLP = [
        { personalId: 'DRV-LP-001', name: 'Elena Marinescu', email: 'elena@logistics-pro.ro', phone: '+40722222001', rating: 4.6 },
        { personalId: 'DRV-LP-002', name: 'Cristian Radu', email: 'cristian@logistics-pro.ro', phone: '+40722222002', rating: 4.8 },
        { personalId: 'DRV-LP-003', name: 'Alina Stoica', email: 'alina@logistics-pro.ro', phone: '+40722222003', rating: 4.9 },
    ];

    const allDrivers = [];

    for (const driverData of driversTE) {
        const driver = await prisma.user.create({
            data: {
                ...driverData,
                password: hashedPassword,
                role: 'DRIVER',
                isActive: true,
                companyId: transportExpress.id,
            },
        });
        allDrivers.push(driver);
        console.log('   ✓ Driver created:', driver.personalId, '-', driver.name, '(Transport Express)');
    }

    for (const driverData of driversLP) {
        const driver = await prisma.user.create({
            data: {
                ...driverData,
                password: hashedPassword,
                role: 'DRIVER',
                isActive: true,
                companyId: logisticsPro.id,
            },
        });
        allDrivers.push(driver);
        console.log('   ✓ Driver created:', driver.personalId, '-', driver.name, '(Logistics Pro)');
    }

    // ============================================
    // 5. CREATE VEHICLES
    // ============================================
    console.log('\n🚚 Creating Vehicles...');

    const vehiclesTE = [
        { plate: 'B-123-ABC', model: 'Mercedes Sprinter', year: 2022, type: 'VAN' },
        { plate: 'B-456-DEF', model: 'Volkswagen Crafter', year: 2021, type: 'VAN' },
        { plate: 'B-789-GHI', model: 'Ford Transit', year: 2023, type: 'VAN' },
    ];

    const vehiclesLP = [
        { plate: 'B-111-XYZ', model: 'Renault Master', year: 2022, type: 'VAN' },
        { plate: 'B-222-UVW', model: 'Iveco Daily', year: 2021, type: 'VAN' },
        { plate: 'B-333-RST', model: 'Peugeot Boxer', year: 2023, type: 'VAN' },
    ];

    for (const vehicleData of vehiclesTE) {
        await prisma.vehicle.create({
            data: {
                ...vehicleData,
                isActive: true,
                companyId: transportExpress.id,
            },
        });
        console.log('   ✓ Vehicle created:', vehicleData.plate, 'for', transportExpress.name);
    }

    for (const vehicleData of vehiclesLP) {
        await prisma.vehicle.create({
            data: {
                ...vehicleData,
                isActive: true,
                companyId: logisticsPro.id,
            },
        });
        console.log('   ✓ Vehicle created:', vehicleData.plate, 'for', logisticsPro.name);
    }

    // ============================================
    // 6. CREATE TASKS
    // ============================================
    console.log('\n📦 Creating Tasks...');

    const taskTemplates = [
        { title: 'Livrare Colete Sector 1', description: 'Livrare pachete în zona Piața Victoriei', location: 'Sector 1, București' },
        { title: 'Transport Marfă Pipera', description: 'Ridicare și livrare marfă la depozit Pipera', location: 'Pipera, București' },
        { title: 'Livrare Documente Otopeni', description: 'Livrare pachet urgent la Aeroport Otopeni', location: 'Otopeni, Ilfov' },
        { title: 'Transport Echipamente IT', description: 'Mutare echipamente IT între birouri', location: 'Sector 2, București' },
        { title: 'Livrare Mobilier Berceni', description: 'Transport și livrare mobilier rezidențial', location: 'Berceni, București' },
        { title: 'Ridicare Colete Militari', description: 'Ridicare comenzi de la depozit Militari', location: 'Militari, București' },
        { title: 'Livrare Electrocasnice', description: 'Transport și instalare electrocasnice', location: 'Sector 3, București' },
        { title: 'Transport Produse Alimentare', description: 'Livrare produse proaspete la supermarket', location: 'Titan, București' },
    ];

    const allTasks = [];

    // Create tasks for Transport Express
    const driversForTE = allDrivers.filter(d => d.companyId === transportExpress.id);
    for (let i = 0; i < 15; i++) {
        const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        const status = i < 8 ? 'COMPLETED' : i < 12 ? 'ACCEPTED' : 'PENDING';
        const scheduledDate = randomDate(status === 'COMPLETED' ? 30 : 7);
        const price = 50 + Math.floor(Math.random() * 200);

        const taskData = {
            title: template.title,
            description: template.description,
            location: template.location,
            scheduledDate: setRandomTime(scheduledDate),
            price: price,
            status: status,
            createdById: adminTE.id,
            companyId: transportExpress.id,
        };

        if (status !== 'PENDING') {
            const driver = driversForTE[Math.floor(Math.random() * driversForTE.length)];
            taskData.assignedToId = driver.id;
        }

        if (status === 'COMPLETED') {
            taskData.completedAt = setRandomTime(new Date(scheduledDate.getTime() + Math.random() * 12 * 60 * 60 * 1000));
            taskData.actualEarnings = price;
        }

        const task = await prisma.task.create({ data: taskData });
        allTasks.push(task);
    }
    console.log('   ✓ Created 15 tasks for', transportExpress.name);

    // Create tasks for Logistics Pro
    const driversForLP = allDrivers.filter(d => d.companyId === logisticsPro.id);
    for (let i = 0; i < 12; i++) {
        const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        const status = i < 6 ? 'COMPLETED' : i < 9 ? 'ACCEPTED' : 'PENDING';
        const scheduledDate = randomDate(status === 'COMPLETED' ? 30 : 7);
        const price = 50 + Math.floor(Math.random() * 200);

        const taskData = {
            title: template.title,
            description: template.description,
            location: template.location,
            scheduledDate: setRandomTime(scheduledDate),
            price: price,
            status: status,
            createdById: adminLP.id,
            companyId: logisticsPro.id,
        };

        if (status !== 'PENDING') {
            const driver = driversForLP[Math.floor(Math.random() * driversForLP.length)];
            taskData.assignedToId = driver.id;
        }

        if (status === 'COMPLETED') {
            taskData.completedAt = setRandomTime(new Date(scheduledDate.getTime() + Math.random() * 12 * 60 * 60 * 1000));
            taskData.actualEarnings = price;
        }

        const task = await prisma.task.create({ data: taskData });
        allTasks.push(task);
    }
    console.log('   ✓ Created 12 tasks for', logisticsPro.name);

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

        console.log(`   ✓ ${driver.personalId}: ${completedTasks.length} completed, ${totalEarnings.toFixed(2)} RON`);
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
    console.log('   - ADMIN-TE-001 / password123 (Transport Express)');
    console.log('   - ADMIN-LP-001 / password123 (Logistics Pro)');
    console.log('\n   Drivers (Transport Express):');
    console.log('   - DRV-TE-001 / password123 (Ion Popescu)');
    console.log('   - DRV-TE-002 / password123 (Maria Dumitrescu)');
    console.log('   - DRV-TE-003 / password123 (Andrei Vasile)');
    console.log('\n   Drivers (Logistics Pro):');
    console.log('   - DRV-LP-001 / password123 (Elena Marinescu)');
    console.log('   - DRV-LP-002 / password123 (Cristian Radu)');
    console.log('   - DRV-LP-003 / password123 (Alina Stoica)');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
