
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkRole() {
    const user = await prisma.user.findUnique({ where: { personalId: 'BD6622' } });
    console.log(user);
}
checkRole();
