import express from 'express';
import prisma from "../lib/prisma.js";
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Get driver statistics
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user with statistics
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                totalEarnings: true,
                totalTasks: true,
                completedTasks: true,
                rating: true
            }
        });

        // Get this month's earnings
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyTasks = await prisma.task.findMany({
            where: {
                assignedToId: userId,
                status: 'COMPLETED',
                scheduledDate: {
                    gte: firstDayOfMonth
                }
            }
        });

        const monthlyEarnings = monthlyTasks.reduce((sum, task) => sum + (task.actualEarnings || task.price), 0);

        // Get this week's earnings
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());

        const weeklyTasks = await prisma.task.findMany({
            where: {
                assignedToId: userId,
                status: 'COMPLETED',
                scheduledDate: {
                    gte: firstDayOfWeek
                }
            }
        });

        const weeklyEarnings = weeklyTasks.reduce((sum, task) => sum + (task.actualEarnings || task.price), 0);

        res.json({
            stats: {
                ...user,
                monthlyEarnings,
                weeklyEarnings,
                monthlyTasks: monthlyTasks.length,
                weeklyTasks: weeklyTasks.length
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get earnings history
router.get('/earnings', async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = 'month' } = req.query; // month, week, year

        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default: // month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: userId,
                status: 'COMPLETED',
                scheduledDate: {
                    gte: startDate
                }
            },
            orderBy: { scheduledDate: 'desc' }
        });

        const totalEarnings = tasks.reduce((sum, task) => sum + (task.actualEarnings || task.price), 0);

        res.json({
            earnings: {
                total: totalEarnings,
                tasks: tasks.map(task => ({
                    id: task.id,
                    title: task.title,
                    amount: task.actualEarnings || task.price,
                    completedAt: task.completedAt,
                    scheduledDate: task.scheduledDate
                }))
            }
        });
    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ error: 'Failed to fetch earnings' });
    }
});

// Get monthly earnings history
router.get('/earnings/monthly', async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const monthlyHistory = [];

        // Romanian month names
        const monthNames = [
            'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
            'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
        ];

        // Get earnings for last 12 months
        for (let i = 0; i < 12; i++) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();

            // First day of the month
            const firstDay = new Date(year, month, 1);
            // First day of next month
            const lastDay = new Date(year, month + 1, 1);

            const monthTasks = await prisma.task.findMany({
                where: {
                    assignedToId: userId,
                    status: 'COMPLETED',
                    scheduledDate: {
                        gte: firstDay,
                        lt: lastDay
                    }
                }
            });

            const monthEarnings = monthTasks.reduce((sum, task) => sum + (task.actualEarnings || task.price), 0);

            // Format month as YYYY-MM
            const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

            monthlyHistory.push({
                month: monthStr,
                year: year,
                monthNumber: month + 1,
                monthName: monthNames[month],
                earnings: monthEarnings,
                taskCount: monthTasks.length
            });
        }

        res.json({ monthlyHistory });
    } catch (error) {
        console.error('Get monthly earnings error:', error);
        res.status(500).json({ error: 'Failed to fetch monthly earnings' });
    }
});

// Get task history
router.get('/history', async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, limit = 50 } = req.query;

        const where = {
            assignedToId: userId
        };

        if (status) {
            where.status = status;
        }

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { scheduledDate: 'desc' },
            take: parseInt(limit),
            include: {
                createdBy: {
                    select: {
                        name: true
                    }
                }
            }
        });

        res.json({ tasks });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch task history' });
    }
});

// Update profile
router.put('/profile', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            vehicleType,
            vehiclePlate,
            vehicleModel,
            licenseNumber,
            licenseExpiry,
            insuranceExpiry,
            preferredZones,
            notificationsEnabled,
            language,
            darkMode
        } = req.body;

        const updateData = {};
        if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
        if (vehiclePlate !== undefined) updateData.vehiclePlate = vehiclePlate;
        if (vehicleModel !== undefined) updateData.vehicleModel = vehicleModel;
        if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
        if (licenseExpiry !== undefined) updateData.licenseExpiry = new Date(licenseExpiry);
        if (insuranceExpiry !== undefined) updateData.insuranceExpiry = new Date(insuranceExpiry);
        if (preferredZones !== undefined) updateData.preferredZones = JSON.stringify(preferredZones);
        if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
        if (language !== undefined) updateData.language = language;
        if (darkMode !== undefined) updateData.darkMode = darkMode;

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                personalId: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                photoUrl: true,
                vehicleType: true,
                vehiclePlate: true,
                vehicleModel: true,
                licenseNumber: true,
                licenseExpiry: true,
                insuranceExpiry: true,
                preferredZones: true,
                notificationsEnabled: true,
                language: true,
                darkMode: true
            }
        });

        res.json({ user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Upload profile picture
router.post('/profile/photo', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id;
        // Construct URL for the uploaded file
        const photoUrl = `/uploads/profiles/${req.file.filename}`;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { photoUrl },
            select: {
                id: true,
                photoUrl: true
            }
        });

        res.json({ user });
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

export default router;
