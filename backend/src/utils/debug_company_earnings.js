
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCompanyEarnings() {
    // 1. Get Admin Company
    const admin = await prisma.user.findUnique({ where: { personalId: 'BD6622' } });
    if (!admin) { console.log('Admin not found'); return; }
    console.log(`Admin: ${admin.name}, Company ID: ${admin.companyId}`);

    const companyId = admin.companyId;

    // 2. Check Completed Tasks for this company
    const tasks = await prisma.task.findMany({
        where: {
            companyId: companyId,
            status: 'COMPLETED'
        }
    });

    console.log(`Found ${tasks.length} completed tasks for company.`);

    let totalActual = 0;
    let totalPrice = 0;

    tasks.forEach(t => {
        console.log(`Task ${t.id}: Status=${t.status}, Price=${t.price}, ActualEarnings=${t.actualEarnings}`);
        totalActual += Number(t.actualEarnings || 0);
        totalPrice += Number(t.price || 0);
    });

    console.log(`Total Actual Earnings (Backend logic): ${totalActual}`);
    console.log(`Total Price (Potential fallback): ${totalPrice}`);
}

checkCompanyEarnings();
