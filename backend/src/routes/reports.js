import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { addCompanyFilter, requireFeature } from '../middleware/permissions.js';
import * as exportController from '../controllers/exportController.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get weekly performance report
router.get('/weekly', requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        console.log(`[GET /reports/weekly] Fetching report for ${startDate} to ${endDate}`);
        console.log(`[GET /reports/weekly] User role: ${req.user.role}, companyId: ${req.user.companyId}`);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Build where clause for drivers - filter by company for COMPANY_ADMIN
        const whereClause = { role: 'DRIVER' };
        if (req.user.role === 'COMPANY_ADMIN') {
            whereClause.companyId = req.user.companyId;
        }

        // Get drivers (filtered by company for COMPANY_ADMIN, all for SUPER_ADMIN)
        const drivers = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                personalId: true,
                name: true,
                email: true,
                phone: true,
                rating: true,
                companyId: true
            },
            orderBy: { name: 'asc' }
        });

        // Calculate stats for each driver
        const driversWithStats = await Promise.all(
            drivers.map(async (driver) => {
                // Count completed tasks
                const completed = await prisma.task.count({
                    where: {
                        assignedToId: driver.id,
                        status: 'COMPLETED',
                        completedAt: {
                            gte: start,
                            lte: end
                        }
                    }
                });

                // Count pending tasks
                const pending = await prisma.task.count({
                    where: {
                        assignedToId: driver.id,
                        status: 'PENDING',
                        scheduledDate: {
                            gte: start,
                            lte: end
                        }
                    }
                });

                // Count accepted tasks
                const accepted = await prisma.task.count({
                    where: {
                        assignedToId: driver.id,
                        status: 'ACCEPTED',
                        scheduledDate: {
                            gte: start,
                            lte: end
                        }
                    }
                });

                // Calculate earnings from completed tasks
                const completedTasks = await prisma.task.findMany({
                    where: {
                        assignedToId: driver.id,
                        status: 'COMPLETED',
                        completedAt: {
                            gte: start,
                            lte: end
                        }
                    },
                    select: {
                        price: true
                    }
                });

                const earnings = completedTasks.reduce((sum, task) => sum + Number(task.price), 0);

                return {
                    ...driver,
                    weeklyStats: {
                        completed,
                        pending,
                        accepted,
                        earnings: Math.round(earnings * 100) / 100
                    }
                };
            })
        );

        // Calculate totals
        const totals = driversWithStats.reduce(
            (acc, driver) => ({
                completed: acc.completed + driver.weeklyStats.completed,
                pending: acc.pending + driver.weeklyStats.pending,
                accepted: acc.accepted + driver.weeklyStats.accepted,
                earnings: acc.earnings + driver.weeklyStats.earnings
            }),
            { completed: 0, pending: 0, accepted: 0, earnings: 0 }
        );

        console.log(`[GET / reports / weekly] Found ${driversWithStats.length} drivers, total earnings: ${totals.earnings} `);

        res.json({
            drivers: driversWithStats,
            totals: {
                ...totals,
                earnings: Math.round(totals.earnings * 100) / 100
            },
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString()
            }
        });
    } catch (error) {
        console.error('[GET /reports/weekly] Error:', error);
        res.status(500).json({ error: 'Failed to fetch weekly report', details: error.message });
    }
});

// CSV Export for Company Admins - requires csvExport feature
router.get('/export/csv', requireAdmin, addCompanyFilter, requireFeature('csvExport'), exportController.generateWeeklyCSV);

// PDF Invoice for Drivers - requires pdfExport feature
router.get('/export/pdf', requireFeature('pdfExport'), exportController.generateDriverInvoice);

export default router;
