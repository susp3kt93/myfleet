import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Get recent activity
router.get('/activity', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const companyId = req.user.companyId;

        const activity = await prisma.activityLog.findMany({
            where: {
                companyId: companyId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        photoUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: Number(limit)
        });

        res.json(activity);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

export default router;
