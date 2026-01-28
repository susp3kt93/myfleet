import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Get recent activity
// Get recent activity with filtering and pagination
router.get('/activity', async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, action } = req.query;
        const companyId = req.user.companyId;

        const where = {
            companyId: companyId
        };

        if (userId && userId !== 'all') {
            where.userId = userId;
        }

        if (action && action !== 'all') {
            where.action = action;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [activity, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            photoUrl: true,
                            personalId: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: Number(limit),
                skip: skip
            }),
            prisma.activityLog.count({ where })
        ]);

        res.json({
            activity,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

export default router;
