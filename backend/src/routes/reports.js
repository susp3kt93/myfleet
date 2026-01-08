import express from 'express';
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { addCompanyFilter, requireFeature } from '../middleware/permissions.js';
import * as exportController from '../controllers/exportController.js';

const router = express.Router();

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
                        scheduledDate: {
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
                        scheduledDate: {
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

// ============================================
// GET /reports/driver-activity - Driver activity calendar view
// Shows all drivers with their daily activity (tasks per day, time off)
// ============================================
router.get('/driver-activity', requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        console.log(`[GET /reports/driver-activity] Fetching activity for ${startDate} to ${endDate}`);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Build where clause for drivers
        const whereClause = { role: 'DRIVER', isActive: true };
        if (req.user.role === 'COMPANY_ADMIN') {
            whereClause.companyId = req.user.companyId;
        }

        // Get all drivers
        const drivers = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                personalId: true,
                name: true,
                photoUrl: true,
                companyId: true
            },
            orderBy: { name: 'asc' }
        });

        // Get all tasks in date range
        const taskWhereClause = {
            scheduledDate: { gte: start, lte: end },
            assignedToId: { not: null }
        };
        if (req.user.role === 'COMPANY_ADMIN') {
            taskWhereClause.companyId = req.user.companyId;
        }

        const tasks = await prisma.task.findMany({
            where: taskWhereClause,
            select: {
                id: true,
                title: true,
                scheduledDate: true,
                status: true,
                price: true,
                assignedToId: true,
                location: true
            }
        });

        // Get all time-off requests in date range
        const timeOffWhereClause = {
            requestDate: { gte: start, lte: end },
            status: 'APPROVED'
        };
        if (req.user.role === 'COMPANY_ADMIN') {
            timeOffWhereClause.companyId = req.user.companyId;
        }

        const timeOffRequests = await prisma.timeOffRequest.findMany({
            where: timeOffWhereClause,
            select: {
                id: true,
                requestDate: true,
                userId: true,
                reason: true
            }
        });

        // Generate date range array
        const dates = [];
        const currentDate = new Date(start);
        while (currentDate <= end) {
            dates.push(new Date(currentDate).toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Build activity matrix for each driver
        const driversActivity = drivers.map(driver => {
            const driverTasks = tasks.filter(t => t.assignedToId === driver.id);
            const driverTimeOff = timeOffRequests.filter(t => t.userId === driver.id);

            // Build daily activity
            const dailyActivity = {};
            let totalTasks = 0;
            let completedTasks = 0;
            let totalEarnings = 0;
            let daysWorked = 0;
            let daysOff = 0;

            dates.forEach(dateStr => {
                const dayTasks = driverTasks.filter(t =>
                    t.scheduledDate.toISOString().split('T')[0] === dateStr
                );
                const dayOff = driverTimeOff.find(t =>
                    t.requestDate.toISOString().split('T')[0] === dateStr
                );

                if (dayOff) {
                    dailyActivity[dateStr] = {
                        type: 'OFF',
                        reason: dayOff.reason
                    };
                    daysOff++;
                } else if (dayTasks.length > 0) {
                    const completed = dayTasks.filter(t => t.status === 'COMPLETED').length;
                    const earnings = dayTasks
                        .filter(t => t.status === 'COMPLETED')
                        .reduce((sum, t) => sum + Number(t.price), 0);

                    dailyActivity[dateStr] = {
                        type: 'WORKED',
                        taskCount: dayTasks.length,
                        completedCount: completed,
                        earnings: earnings,
                        tasks: dayTasks.map(t => ({
                            id: t.id,
                            title: t.title,
                            status: t.status,
                            location: t.location
                        }))
                    };
                    totalTasks += dayTasks.length;
                    completedTasks += completed;
                    totalEarnings += earnings;
                    daysWorked++;
                } else {
                    dailyActivity[dateStr] = {
                        type: 'IDLE'
                    };
                }
            });

            return {
                driver: {
                    id: driver.id,
                    personalId: driver.personalId,
                    name: driver.name,
                    photoUrl: driver.photoUrl
                },
                dailyActivity,
                summary: {
                    daysWorked,
                    daysOff,
                    totalTasks,
                    completedTasks,
                    totalEarnings: Math.round(totalEarnings * 100) / 100
                }
            };
        });

        // Calculate overall totals
        const totals = driversActivity.reduce(
            (acc, d) => ({
                daysWorked: acc.daysWorked + d.summary.daysWorked,
                daysOff: acc.daysOff + d.summary.daysOff,
                totalTasks: acc.totalTasks + d.summary.totalTasks,
                completedTasks: acc.completedTasks + d.summary.completedTasks,
                totalEarnings: acc.totalEarnings + d.summary.totalEarnings
            }),
            { daysWorked: 0, daysOff: 0, totalTasks: 0, completedTasks: 0, totalEarnings: 0 }
        );

        res.json({
            drivers: driversActivity,
            dates,
            totals: {
                ...totals,
                totalEarnings: Math.round(totals.totalEarnings * 100) / 100
            },
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString()
            }
        });
    } catch (error) {
        console.error('[GET /reports/driver-activity] Error:', error);
        res.status(500).json({ error: 'Failed to fetch driver activity', details: error.message });
    }
});

// CSV Export for Company Admins - requires csvExport feature
router.get('/export/csv', requireAdmin, addCompanyFilter, requireFeature('csvExport'), exportController.generateWeeklyCSV);

// PDF Invoice for Drivers - requires pdfExport feature
router.get('/export/pdf', requireFeature('pdfExport'), exportController.generateDriverInvoice);

export default router;

