import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting multi-tenant seed...');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ============================================
    // 1. CREATE SUPER ADMIN
    // ============================================
    console.log('👑 Creating Super Admin...');
    const superAdmin = await prisma.user.create({
        data: {
            personalId: 'SA001',
            name: 'Super Admin',
            email: 'superadmin@myfleet.com',
            phone: '+373 60 000 000',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true,
            companyId: null // Super Admin doesn't belong to any company
        }
    });
    console.log(`✅ Super Admin created: ${superAdmin.email}`);

    // ============================================
    // 2. CREATE COMPANY A - "Transport Express SRL"
    // ============================================
    console.log('\n🏢 Creating Company A...');
    const companyA = await prisma.company.create({
        data: {
            name: 'Transport Express SRL',
            email: 'contact@transport-express.md',
            phone: '+373 22 123 456',
            address: 'Bd. Ștefan cel Mare 123, Chișinău, Moldova',
            taxId: '1234567890',
            plan: 'PREMIUM',
            maxDrivers: 10,
            maxVehicles: 10,
            isActive: true
        }
    });
    console.log(`✅ Company A created: ${companyA.name}`);

    // Create Company Admin A
    const adminA = await prisma.user.create({
        data: {
            personalId: 'ADM-A001',
            name: 'Ion Popescu',
            email: 'admin@transport-express.md',
            phone: '+373 60 111 111',
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
            companyId: companyA.id,
            isActive: true
        }
    });
    console.log(`✅ Company Admin A created: ${adminA.email}`);

    // Create 5 drivers for Company A
    const driversA = [];
    const driverNamesA = ['Vasile Lungu', 'Alexandru Rusu', 'Dumitru Cojocaru', 'Andrei Croitor', 'Sergiu Moraru'];

    for (let i = 0; i < 5; i++) {
        const driver = await prisma.user.create({
            data: {
                personalId: `DRV-A00${i + 1}`,
                name: driverNamesA[i],
                email: `driver${i + 1}@transport-express.md`,
                phone: `+373 60 ${200 + i}00 ${100 + i}`,
                password: hashedPassword,
                role: 'DRIVER',
                companyId: companyA.id,
                isActive: true,
                licenseNumber: `MD${1000000 + i}`,
                language: 'ro'
            }
        });
        driversA.push(driver);
        console.log(`  👤 Driver created: ${driver.name}`);
    }

    // Create vehicles for Company A
    console.log('🚚 Creating vehicles for Company A...');
    const vehicleTypesA = ['Truck', 'Van', 'Truck', 'Van', 'Car'];
    const vehiclesA = [];

    for (let i = 0; i < 5; i++) {
        const vehicle = await prisma.vehicle.create({
            data: {
                type: vehicleTypesA[i],
                plate: `C TA ${100 + i}`,
                model: vehicleTypesA[i] === 'Truck' ? 'Mercedes Actros' : vehicleTypesA[i] === 'Van' ? 'Ford Transit' : 'Dacia Logan',
                year: 2020 + i,
                capacity: vehicleTypesA[i] === 'Truck' ? '12t' : vehicleTypesA[i] === 'Van' ? '3.5t' : '500kg',
                companyId: companyA.id,
                assignedToId: driversA[i].id,
                isActive: true
            }
        });
        vehiclesA.push(vehicle);
    }

    // ============================================
    // 3. CREATE COMPANY B - "Logistics Pro SRL"
    // ============================================
    console.log('\n🏢 Creating Company B...');
    const companyB = await prisma.company.create({
        data: {
            name: 'Logistics Pro SRL',
            email: 'info@logistics-pro.md',
            phone: '+373 22 987 654',
            address: 'Str. Alba Iulia 75, Chișinău, Moldova',
            taxId: '0987654321',
            plan: 'BASIC',
            maxDrivers: 8,
            maxVehicles: 8,
            isActive: true
        }
    });
    console.log(`✅ Company B created: ${companyB.name}`);

    // Create Company Admin B
    const adminB = await prisma.user.create({
        data: {
            personalId: 'ADM-B001',
            name: 'Maria Ionescu',
            email: 'admin@logistics-pro.md',
            phone: '+373 60 222 222',
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
            companyId: companyB.id,
            isActive: true
        }
    });
    console.log(`✅ Company Admin B created: ${adminB.email}`);

    // Create 5 drivers for Company B
    const driversB = [];
    const driverNamesB = ['Elena Stanciu', 'Mihai Gheorghe', 'Cristina Dumitrescu', 'Victor Munteanu', 'Ana Popa'];

    for (let i = 0; i < 5; i++) {
        const driver = await prisma.user.create({
            data: {
                personalId: `DRV-B00${i + 1}`,
                name: driverNamesB[i],
                email: `driver${i + 1}@logistics-pro.md`,
                phone: `+373 60 ${300 + i}00 ${200 + i}`,
                password: hashedPassword,
                role: 'DRIVER',
                companyId: companyB.id,
                isActive: true,
                licenseNumber: `MD${2000000 + i}`,
                language: 'ro'
            }
        });
        driversB.push(driver);
        console.log(`  👤 Driver created: ${driver.name}`);
    }

    // Create vehicles for Company B
    console.log('🚚 Creating vehicles for Company B...');
    for (let i = 0; i < 5; i++) {
        await prisma.vehicle.create({
            data: {
                type: vehicleTypesA[i],
                plate: `C TB ${200 + i}`,
                model: vehicleTypesA[i] === 'Truck' ? 'Volvo FH' : vehicleTypesA[i] === 'Van' ? 'Mercedes Sprinter' : 'Renault Logan',
                year: 2019 + i,
                capacity: vehicleTypesA[i] === 'Truck' ? '15t' : vehicleTypesA[i] === 'Van' ? '4t' : '600kg',
                companyId: companyB.id,
                assignedToId: driversB[i].id,
                isActive: true
            }
        });
    }

    // ============================================
    // 4. CREATE TASKS FOR COMPANY A
    // ============================================
    console.log('\n📋 Creating tasks for Company A...');

    const locationsA = [
        { name: 'Chișinău - Bălți', lat: 47.7614, lng: 27.9297 },
        { name: 'Chișinău - Cahul', lat: 45.9081, lng: 28.1944 },
        { name: 'Chișinău - Soroca', lat: 48.1556, lng: 28.2969 },
        { name: 'Chișinău - Orhei', lat: 47.3856, lng: 28.8258 },
        { name: 'Chișinău - Ungheni', lat: 47.2108, lng: 27.8003 }
    ];

    // Pending tasks for all drivers in Company A
    for (let i = 0; i < driversA.length; i++) {
        for (let j = 0; j < 2; j++) {
            const location = locationsA[j];
            await prisma.task.create({
                data: {
                    title: `Livrare ${location.name}`,
                    description: `Transport marfă pe ruta ${location.name}. Preluare la depozit central.`,
                    scheduledDate: new Date(Date.now() + (j + 1) * 24 * 60 * 60 * 1000),
                    scheduledTime: `${8 + j}:00`,
                    status: 'PENDING',
                    price: 500 + j * 100,
                    location: location.name,
                    latitude: location.lat,
                    longitude: location.lng,
                    companyId: companyA.id,
                    assignedToId: driversA[i].id,
                    createdById: adminA.id
                }
            });
        }
    }

    // Completed tasks for Company A
    for (let i = 0; i < driversA.length; i++) {
        for (let j = 0; j < 3; j++) {
            const location = locationsA[(i + j) % locationsA.length];
            await prisma.task.create({
                data: {
                    title: `Livrare ${location.name} - Completată`,
                    description: `Transport marfă completat pe ruta ${location.name}.`,
                    scheduledDate: new Date(Date.now() - (j + 1) * 24 * 60 * 60 * 1000),
                    scheduledTime: `${9 + j}:00`,
                    status: 'COMPLETED',
                    price: 600 + j * 50,
                    actualEarnings: 600 + j * 50,
                    location: location.name,
                    latitude: location.lat,
                    longitude: location.lng,
                    completedAt: new Date(Date.now() - j * 24 * 60 * 60 * 1000),
                    companyId: companyA.id,
                    assignedToId: driversA[i].id,
                    createdById: adminA.id,
                    rating: 4.5 + Math.random() * 0.5
                }
            });
        }
    }
    console.log('✅ Tasks created for Company A: 10 pending + 15 completed');

    // ============================================
    // 5. CREATE TASKS FOR COMPANY B
    // ============================================
    console.log('\n📋 Creating tasks for Company B...');

    const locationsB = [
        { name: 'Chișinău - Tiraspol', lat: 46.8403, lng: 29.6433 },
        { name: 'Chișinău - Comrat', lat: 46.2981, lng: 28.6556 },
        { name: 'Chișinău - Edineț', lat: 48.1667, lng: 27.3000 },
        { name: 'Chișinău - Căușeni', lat: 46.6500, lng: 29.4167 },
        { name: 'Chișinău - Hîncești', lat: 46.8289, lng: 28.5889 }
    ];

    // Pending tasks for all drivers in Company B
    for (let i = 0; i < driversB.length; i++) {
        for (let j = 0; j < 2; j++) {
            const location = locationsB[j];
            await prisma.task.create({
                data: {
                    title: `Transport ${location.name}`,
                    description: `Livrare urgentă ${location.name}. Verificare marfă obligatorie.`,
                    scheduledDate: new Date(Date.now() + (j + 1) * 24 * 60 * 60 * 1000),
                    scheduledTime: `${10 + j}:00`,
                    status: 'PENDING',
                    price: 450 + j * 75,
                    location: location.name,
                    latitude: location.lat,
                    longitude: location.lng,
                    companyId: companyB.id,
                    assignedToId: driversB[i].id,
                    createdById: adminB.id
                }
            });
        }
    }

    // Completed tasks for Company B
    for (let i = 0; i < driversB.length; i++) {
        for (let j = 0; j < 3; j++) {
            const location = locationsB[(i + j) % locationsB.length];
            await prisma.task.create({
                data: {
                    title: `Transport ${location.name} - Finalizat`,
                    description: `Livrare finalizată cu succes pe ruta ${location.name}.`,
                    scheduledDate: new Date(Date.now() - (j + 1) * 24 * 60 * 60 * 1000),
                    scheduledTime: `${11 + j}:00`,
                    status: 'COMPLETED',
                    price: 550 + j * 60,
                    actualEarnings: 550 + j * 60,
                    location: location.name,
                    latitude: location.lat,
                    longitude: location.lng,
                    completedAt: new Date(Date.now() - j * 24 * 60 * 60 * 1000),
                    companyId: companyB.id,
                    assignedToId: driversB[i].id,
                    createdById: adminB.id,
                    rating: 4.0 + Math.random() * 0.8
                }
            });
        }
    }
    console.log('✅ Tasks created for Company B: 10 pending + 15 completed');

    // ============================================
    // 6. UPDATE USER STATISTICS
    // ============================================
    console.log('\n📊 Updating user statistics...');

    for (const driver of [...driversA, ...driversB]) {
        const completedTasks = await prisma.task.count({
            where: { assignedToId: driver.id, status: 'COMPLETED' }
        });

        const earnings = await prisma.task.aggregate({
            where: { assignedToId: driver.id, status: 'COMPLETED' },
            _sum: { actualEarnings: true }
        });

        await prisma.user.update({
            where: { id: driver.id },
            data: {
                completedTasks: completedTasks,
                totalEarnings: earnings._sum.actualEarnings || 0,
                totalTasks: await prisma.task.count({ where: { assignedToId: driver.id } })
            }
        });
    }

    console.log('\n✅ Multi-tenant seed completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Super Admin: superadmin@myfleet.com / password123');
    console.log('   Company A Admin: admin@transport-express.md / password123');
    console.log('   Company B Admin: admin@logistics-pro.md / password123');
    console.log('   All Drivers: driver1@[company].md / password123');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
