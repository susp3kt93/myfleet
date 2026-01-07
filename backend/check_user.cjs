const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function checkUser() {
    const user = await prisma.user.findUnique({
        where: { personalId: 'BD6622' },
        select: { personalId: true, name: true, password: true }
    });

    console.log('User found:', user);
    console.log('Password hash:', user?.password);

    await prisma.$disconnect();
}

checkUser().catch(console.error);
