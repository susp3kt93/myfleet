import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { personalId: 'ADMIN-001' },
        update: {},
        create: {
            personalId: 'ADMIN-001',
            password: adminPassword,
            name: 'Administrator',
            email: 'admin@myfleet.com',
            phone: '+40700000000',
            role: 'ADMIN',
            photoUrl: 'https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff'
        }
    });
    console.log('✅ Created admin user:', admin.personalId);

    // Create sample drivers
    const driverPassword = await bcrypt.hash('driver123', 10);

    const driver1 = await prisma.user.upsert({
        where: { personalId: 'DRV-001' },
        update: {},
        create: {
            personalId: 'DRV-001',
            password: driverPassword,
            name: 'Ion Popescu',
            email: 'ion.popescu@myfleet.com',
            phone: '+40700000001',
            role: 'DRIVER',
            photoUrl: 'https://ui-avatars.com/api/?name=Ion+Popescu&background=10B981&color=fff'
        }
    });
    console.log('✅ Created driver:', driver1.personalId);

    const driver2 = await prisma.user.upsert({
        where: { personalId: 'DRV-002' },
        update: {},
        create: {
            personalId: 'DRV-002',
            password: driverPassword,
            name: 'Maria Ionescu',
            email: 'maria.ionescu@myfleet.com',
            phone: '+40700000002',
            role: 'DRIVER',
            photoUrl: 'https://ui-avatars.com/api/?name=Maria+Ionescu&background=F59E0B&color=fff'
        }
    });
    console.log('✅ Created driver:', driver2.personalId);

    const driver3 = await prisma.user.upsert({
        where: { personalId: 'DRV-003' },
        update: {},
        create: {
            personalId: 'DRV-003',
            password: driverPassword,
            name: 'Andrei Dumitrescu',
            email: 'andrei.dumitrescu@myfleet.com',
            phone: '+40700000003',
            role: 'DRIVER',
            photoUrl: 'https://ui-avatars.com/api/?name=Andrei+Dumitrescu&background=EF4444&color=fff'
        }
    });
    console.log('✅ Created driver:', driver3.personalId);

    // Create sample tasks for next week
    const today = new Date();
    const tasks = [];

    for (let i = 0; i < 7; i++) {
        const scheduledDate = new Date(today);
        scheduledDate.setDate(today.getDate() + i);

        // Task for driver 1
        const task1 = await prisma.task.create({
            data: {
                title: `Delivery to Bucharest - Day ${i + 1}`,
                description: 'Pick up from warehouse and deliver to client',
                scheduledDate,
                scheduledTime: '09:00',
                price: 150 + (i * 10),
                location: 'Bucharest, Romania',
                status: 'PENDING',
                assignedToId: driver1.id,
                createdById: admin.id
            }
        });
        tasks.push(task1);

        // Task for driver 2
        const task2 = await prisma.task.create({
            data: {
                title: `Route Cluj - Timișoara - Day ${i + 1}`,
                description: 'Long distance delivery',
                scheduledDate,
                scheduledTime: '07:00',
                price: 250 + (i * 15),
                location: 'Cluj-Napoca to Timișoara',
                status: 'PENDING',
                assignedToId: driver2.id,
                createdById: admin.id
            }
        });
        tasks.push(task2);

        // Some tasks for driver 3 (not all days)
        if (i % 2 === 0) {
            const task3 = await prisma.task.create({
                data: {
                    title: `Local Delivery - Day ${i + 1}`,
                    description: 'Multiple stops in the city',
                    scheduledDate,
                    scheduledTime: '10:00',
                    price: 120 + (i * 8),
                    location: 'Iași, Romania',
                    status: 'PENDING',
                    assignedToId: driver3.id,
                    createdById: admin.id
                }
            });
            tasks.push(task3);
        }
    }

    console.log(`✅ Created ${tasks.length} sample tasks`);

    console.log('\n📝 Login credentials:');
    console.log('Admin: ADMIN-001 / admin123');
    console.log('Driver 1: DRV-001 / driver123');
    console.log('Driver 2: DRV-002 / driver123');
    console.log('Driver 3: DRV-003 / driver123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
