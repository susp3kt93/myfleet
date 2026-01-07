import express from 'express';
import prisma from "../lib/prisma.js";

const router = express.Router();

// Debug endpoint - check database connection
router.get('/db-test', async (req, res) => {
    try {
        // Test 1: Check if DATABASE_URL is set
        const hasDbUrl = !!process.env.DATABASE_URL;
        const dbUrlPreview = process.env.DATABASE_URL
            ? process.env.DATABASE_URL.substring(0, 20) + '...'
            : 'NOT SET';

        // Test 2: Try to count users
        const userCount = await prisma.user.count();

        // Test 3: Try to find SA001
        const superAdmin = await prisma.user.findUnique({
            where: { personalId: 'SA001' },
            select: { id: true, personalId: true, name: true, role: true }
        });

        res.json({
            success: true,
            checks: {
                databaseUrlSet: hasDbUrl,
                databaseUrlPreview: dbUrlPreview,
                prismaConnected: true,
                userCount,
                superAdminExists: !!superAdmin,
                superAdmin
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            checks: {
                databaseUrlSet: !!process.env.DATABASE_URL,
                databaseUrlPreview: process.env.DATABASE_URL
                    ? process.env.DATABASE_URL.substring(0, 20) + '...'
                    : 'NOT SET'
            }
        });
    }
});

export default router;
