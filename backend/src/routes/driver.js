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
                totalTasks: true,
                rating: true
            }
        });

        // Calculate total earnings dynamically from ALL completed tasks
        const allCompletedTasks = await prisma.task.findMany({
            where: {
                assignedToId: userId,
                status: 'COMPLETED'
            }
        });

        const totalEarnings = allCompletedTasks.reduce((sum, task) => sum + (task.actualEarnings || task.price || 0), 0);

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

        const monthlyEarnings = monthlyTasks.reduce((sum, task) => sum + (task.actualEarnings || task.price || 0), 0);

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

        const weeklyEarnings = weeklyTasks.reduce((sum, task) => sum + (task.actualEarnings || task.price || 0), 0);

        res.json({
            stats: {
                ...user,
                completedTasks: allCompletedTasks.length, // Dynamic count
                totalEarnings, // Dynamically calculated
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

// Get earnings history with deductions
router.get('/earnings', async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = 'month', startDate: queryStartDate, endDate: queryEndDate } = req.query;

        const now = new Date();
        let startDate, endDate;

        if (queryStartDate && queryEndDate) {
            // Custom date range
            startDate = new Date(queryStartDate);
            endDate = new Date(queryEndDate);
        } else {
            // Predefined period
            switch (period) {
                case 'week':
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 7);
                    endDate = now;
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = now;
                    break;
                default: // month
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = now;
            }
        }

        // Get completed tasks
        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: userId,
                status: 'COMPLETED',
                scheduledDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { scheduledDate: 'desc' }
        });

        const grossEarnings = tasks.reduce((sum, task) => sum + (task.actualEarnings || task.price || 0), 0);

        // Get active deductions for this period
        const deductions = await prisma.deduction.findMany({
            where: {
                userId,
                status: 'ACTIVE',
                startDate: {
                    lte: endDate
                },
                OR: [
                    { endDate: null },
                    { endDate: { gte: startDate } }
                ]
            }
        });

        // Calculate applicable deductions
        const applicableDeductions = [];
        let totalDeductions = 0;

        for (const deduction of deductions) {
            let shouldApply = false;

            if (deduction.frequency === 'WEEKLY') {
                shouldApply = true;
            } else if (deduction.frequency === 'MONTHLY') {
                // Apply if it's the first week of the month or if period is monthly
                const isFirstWeekOfMonth = startDate.getDate() <= 7;
                shouldApply = period === 'month' || isFirstWeekOfMonth;
            } else if (deduction.frequency === 'ONE_TIME' && !deduction.applied) {
                shouldApply = true;
            }

            if (shouldApply) {
                applicableDeductions.push({
                    id: deduction.id,
                    type: deduction.type,
                    description: deduction.description,
                    amount: deduction.amount
                });
                totalDeductions += deduction.amount;
            }
        }

        const netPay = grossEarnings - totalDeductions;

        res.json({
            earnings: {
                period: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString()
                },
                grossEarnings,
                deductions: applicableDeductions,
                totalDeductions,
                netPay,
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

// Upload profile picture (with Vercel Blob Storage)
router.post('/profile/photo', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id;

        // Get current user to check for existing photo
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { photoUrl: true }
        });

        // Upload to Vercel Blob Storage or local
        let photoUrl;
        if (process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN !== 'vercel_blob_rw_PLACEHOLDER_GET_FROM_VERCEL') {
            // Use Blob Storage (production)
            const { uploadToBlob, deleteFromBlob } = await import('../lib/blob.js');
            const pathname = `profiles/${userId}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
            photoUrl = await uploadToBlob(req.file.buffer, pathname);

            // Delete old photo from Blob if exists
            if (currentUser?.photoUrl && currentUser.photoUrl.includes('blob.vercel-storage.com')) {
                await deleteFromBlob(currentUser.photoUrl);
            }
        } else {
            // Fallback to local storage (development)
            const fs = await import('fs');
            const path = await import('path');
            const filename = `${userId}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
            const filepath = `uploads/profiles/${filename}`;

            // Write buffer to disk
            await fs.promises.writeFile(filepath, req.file.buffer);
            photoUrl = `/uploads/profiles/${filename}`;
        }

        // Update user in database
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
