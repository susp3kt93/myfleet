
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixEarnings() {
    console.log('Starting earnings fix...');

    // Find tasks to update
    const tasks = await prisma.task.findMany({
        where: {
            status: 'COMPLETED',
            actualEarnings: null
        }
    });

    console.log(`Found ${tasks.length} tasks to fix.`);

    let updated = 0;
    for (const task of tasks) {
        if (task.price) {
            await prisma.task.update({
                where: { id: task.id },
                data: { actualEarnings: task.price }
            });
            updated++;
        }
    }

    console.log(`Successfully updated ${updated} tasks.`);
}

fixEarnings()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
