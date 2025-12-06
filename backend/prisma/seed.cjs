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
    console.log('🌱 Seeding database with realistic data...');

    // Clear existing data
    await prisma.task.deleteMany({});
    await prisma.user.deleteMany({});

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            personalId: 'ADMIN-001',
            name: 'Administrator',
            email: 'admin@myfleet.com',
            password: hashedAdminPassword,
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log('✓ Admin created:', admin.personalId);

    // Create realistic drivers
    const hashedDriverPassword = await bcrypt.hash('driver123', 10);
    const driverData = [
        {
            personalId: 'DRV-001',
            name: 'Ion Popescu',
            email: 'ion@example.com',
            phone: '+40721234567',
            rating: 4.8
        },
        {
            personalId: 'DRV-002',
            name: 'Maria Ionescu',
            email: 'maria@example.com',
            phone: '+40721234568',
            rating: 4.9
        },
        {
            personalId: 'DRV-003',
            name: 'Andrei Vasile',
            email: 'andrei@example.com',
            phone: '+40721234569',
            rating: 4.6
        },
        {
            personalId: 'DRV-004',
            name: 'Elena Popescu',
            email: 'elena@example.com',
            phone: '+40721234570',
            rating: 4.7
        },
        {
            personalId: 'DRV-005',
            name: 'Mihai Constantinescu',
            email: 'mihai@example.com',
            phone: '+40721234571',
            rating: 4.5
        },
        {
            personalId: 'DRV-006',
            name: 'Ana-Maria Dumitrescu',
            email: 'ana@example.com',
            phone: '+40721234572',
            rating: 4.9
        },
        {
            personalId: 'DRV-007',
            name: 'Radu Georgescu',
            email: 'radu@example.com',
            phone: '+40721234573',
            rating: 4.4
        },
    ];

    const drivers = [];
    for (const data of driverData) {
        const driver = await prisma.user.create({
            data: {
                ...data,
                password: hashedDriverPassword,
                role: 'DRIVER',
                isActive: true,
            },
        });
        drivers.push(driver);
        console.log('✓ Driver created:', driver.personalId, '-', driver.name);
    }

    // Task templates with Romanian locations
    const taskTemplates = [
        { title: 'Livrare Colete Sector 1', description: 'Livrare pachete în zona Piața Victoriei', location: 'Sector 1, București' },
        { title: 'Transport Marfă Pipera', description: 'Ridicare și livrare marfă la depozit Pipera', location: 'Pipera, București' },
        { title: 'Livrare Documente Otopeni', description: 'Livrare pachet urgent la Aeroport Otopeni', location: 'Otopeni, Ilfov' },
        { title: 'Transport Echipamente IT', description: 'Mutare echipamente IT între birouri', location: 'Sector 2, București' },
        { title: 'Livrare Mobilier Berceni', description: 'Transport și livrare mobilier rezidențial', location: 'Berceni, București' },
        { title: 'Ridicare Colete Militari', description: 'Ridicare comenzi de la depozit Militari', location: 'Militari, București' },
        { title: 'Livrare Electrocasnice', description: 'Transport și instalare electrocasnice', location: 'Sector 3, București' },
        { title: 'Transport Produse Alimentare', description: 'Livrare produse proaspete la supermarket', location: 'Titan, București' },
        { title: 'Mutare Birou Pipera-Victoriei', description: 'Mutare echipamente între sedii', location: 'București' },
        { title: 'Livrare Express Centru', description: 'Livrare urgentă documente și pachete mici', location: 'Centru Vechi, București' },
        { title: 'Transport Materiale Construcții', description: 'Livrare materiale la șantier', location: 'Voluntari, Ilfov' },
        { title: 'Ridicare Returnări Magazine', description: 'Colectare produse returnate de clienți', location: 'Sector 4, București' },
        { title: 'Livrare Farmacie Non-Stop', description: 'Livrare medicamente urgente', location: 'Sector 1, București' },
        { title: 'Transport Flori Evenimente', description: 'Livrare aranjamente florale pentru evenimente', location: 'Primăverii, București' },
        { title: 'Livrare Catering Corporate', description: 'Transport mâncare pentru eveniment corporativ', location: 'Barbu Văcărescu, București' },
    ];

    // Create tasks with realistic distribution
    const tasks = [];
    const statusDistribution = [
        { status: 'COMPLETED', count: 15, daysAgo: 30 },
        { status: 'ACCEPTED', count: 8, daysAgo: 7 },
        { status: 'PENDING', count: 10, daysAgo: 3 },
    ];

    let taskCounter = 1;
    for (const { status, count, daysAgo } of statusDistribution) {
        for (let i = 0; i < count; i++) {
            const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
            const scheduledDate = randomDate(daysAgo);
            const price = 50 + Math.floor(Math.random() * 200); // 50-250 RON

            const taskData = {
                title: template.title,
                description: template.description,
                location: template.location,
                scheduledDate: setRandomTime(scheduledDate),
                price: price,
                status: status,
                createdById: admin.id, // All tasks created by admin
            };

            // For ACCEPTED and COMPLETED tasks, assign a driver
            if (status === 'ACCEPTED' || status === 'COMPLETED') {
                const driver = drivers[Math.floor(Math.random() * drivers.length)];
                taskData.assignedToId = driver.id; // Using correct field name from schema
            }

            // For COMPLETED tasks, add completion date
            if (status === 'COMPLETED') {
                taskData.completedAt = setRandomTime(new Date(scheduledDate.getTime() + Math.random() * 12 * 60 * 60 * 1000)); // Completed within 12h after scheduled
                taskData.actualEarnings = price; // Set actual earnings same as price
            }

            const task = await prisma.task.create({ data: taskData });
            tasks.push(task);

            if (taskCounter % 5 === 0) {
                console.log(`✓ Created ${taskCounter} tasks...`);
            }
            taskCounter++;
        }
    }

    console.log(`✓ Total tasks created: ${tasks.length}`);

    // Calculate and update driver statistics
    console.log('\n📊 Calculating driver statistics...');
    for (const driver of drivers) {
        const driverTasks = tasks.filter(t => t.assignedToId === driver.id);
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

    // Calculate and display final stats
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    const totalEarnings = completedTasks.reduce((sum, t) => sum + t.price, 0);

    console.log('\n📊 Database Statistics:');
    console.log(`   - Admins: 1`);
    console.log(`   - Drivers: ${drivers.length}`);
    console.log(`   - Total Tasks: ${tasks.length}`);
    console.log(`   - Completed: ${completedTasks.length}`);
    console.log(`   - Accepted: ${tasks.filter(t => t.status === 'ACCEPTED').length}`);
    console.log(`   - Pending: ${tasks.filter(t => t.status === 'PENDING').length}`);
    console.log(`   - Total Earnings: ${totalEarnings.toFixed(2)} RON`);
    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin:  ADMIN-001 / admin123');
    console.log('   Driver: DRV-001 to DRV-007 / driver123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
