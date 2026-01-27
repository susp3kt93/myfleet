import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
    console.log('🔧 Testing database connection...\n');

    try {
        // Test basic connection
        console.log(' Step 1: Testing basic connection...');
        await prisma.$connect();
        console.log('✅ Successfully connected to database\n');

        // Test if users table exists and count
        console.log('📊 Step 2: Counting users...');
        const userCount = await prisma.user.count();
        console.log(`✅ Found ${userCount} users in database\n`);

        // Try to find SA001
        console.log('🔍 Step 3: Searching for user SA001...');
        const user = await prisma.user.findUnique({
            where: { personalId: 'SA001' }
        });

        if (user) {
            console.log('✅ User found!');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('❌ User SA001 not found in database');
        }

        // List all users with their personalId
        console.log('\n📋 Step 4: Listing all users...');
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                personalId: true,
                name: true,
                role: true
            }
        });
        console.log(`Found ${allUsers.length} users:`);
        allUsers.forEach((u, i) => {
            console.log(`  ${i + 1}. ${u.personalId} - ${u.name} (${u.role})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Disconnected from database');
    }
}

testDatabaseConnection();
