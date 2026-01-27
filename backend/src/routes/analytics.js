import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate as authenticateToken } from '../middleware/auth.js';


const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics/tasks/status-distribution
// Returns count of tasks by status
router.get('/tasks/status-distribution', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Build filter based on role
        let whereClause = {};

        if (userRole === 'DRIVER') {
            whereClause.assignedToId = userId;
        } else if (userRole === 'ADMIN' || userRole === 'COMPANY_ADMIN') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { companyId: true }
            });
            whereClause.companyId = user.companyId;
        }
        // SUPER_ADMIN sees all tasks (no filter)

        // Get counts by status
        const [completed, inProgress, pending, cancelled] = await Promise.all([
            prisma.task.count({ where: { ...whereClause, status: 'COMPLETED' } }),
            prisma.task.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }),
            prisma.task.count({ where: { ...whereClause, status: 'PENDING' } }),
            prisma.task.count({ where: { ...whereClause, status: 'CANCELLED' } })
        ]);

        res.json({
            completed,
            inProgress,
            pending,
            cancelled,
            total: completed + inProgress + pending + cancelled
        });
    } catch (error) {
        console.error('Error fetching task status distribution:', error);
        res.status(500).json({ error: 'Failed to fetch task status distribution' });
    }
});

// GET /api/analytics/tasks/trend?days=7
// Returns daily task creation and completion counts
router.get('/tasks/trend', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const days = parseInt(req.query.days) || 7;

        // Build filter based on role
        let whereClause = {};

        if (userRole === 'DRIVER') {
            whereClause.assignedToId = userId;
        } else if (userRole === 'ADMIN' || userRole === 'COMPANY_ADMIN') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { companyId: true }
            });
            whereClause.companyId = user.companyId;
        }

        // Calculate 2-week range (Current Week + Previous Week)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)

        // Start of current week (Sunday)
        const startOfCurrentWeek = new Date(today);
        startOfCurrentWeek.setDate(today.getDate() - dayOfWeek);
        startOfCurrentWeek.setHours(0, 0, 0, 0);

        // Start of previous week (Sunday 7 days before)
        const startOfPreviousWeek = new Date(startOfCurrentWeek);
        startOfPreviousWeek.setDate(startOfCurrentWeek.getDate() - 7);

        // End of current week (Saturday)
        const endOfWeek = new Date(startOfCurrentWeek);
        endOfWeek.setDate(startOfCurrentWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Fetch tasks in date range (14 days)
        const tasks = await prisma.task.findMany({
            where: {
                ...whereClause,
                createdAt: {
                    gte: startOfPreviousWeek,
                    lte: endOfWeek
                }
            },
            select: {
                createdAt: true,
                completedAt: true,
                status: true
            }
        });

        // Group by date (14 days)
        const trendData = [];
        for (let i = 0; i < 14; i++) {
            const date = new Date(startOfPreviousWeek);
            date.setDate(startOfPreviousWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            const created = tasks.filter(t => {
                const taskDate = new Date(t.createdAt).toISOString().split('T')[0];
                return taskDate === dateStr;
            }).length;

            const completed = tasks.filter(t => {
                if (!t.completedAt) return false;
                const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
                return completedDate === dateStr;
            }).length;

            trendData.push({
                date: dateStr,
                created,
                completed
            });
        }

        res.json(trendData);
    } catch (error) {
        console.error('Error fetching task trend:', error);
        res.status(500).json({ error: 'Failed to fetch task trend' });
    }
});

// GET /api/analytics/users/performance?limit=10
// Returns top performing users by task completion
router.get('/users/performance', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const limit = parseInt(req.query.limit) || 10;

        // Build filter based on role
        let whereClause = {};

        if (userRole === 'ADMIN' || userRole === 'COMPANY_ADMIN') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { companyId: true }
            });
            whereClause.companyId = user.companyId;
        }
        // SUPER_ADMIN sees all users (no filter)
        // DRIVER shouldn't access this endpoint, but we'll allow it

        // Get users with task counts
        const users = await prisma.user.findMany({
            where: {
                ...whereClause,
                role: 'DRIVER' // Only drivers have assigned tasks
            },
            select: {
                id: true,
                personalId: true,
                name: true,
                assignedTasks: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        });

        // Calculate performance metrics
        const performance = users.map(user => {
            const totalTasks = user.assignedTasks.length;
            const completedTasks = user.assignedTasks.filter(t => t.status === 'COMPLETED').length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

            return {
                userId: user.id,
                personalId: user.personalId,
                name: user.name,
                totalTasks,
                completedTasks,
                completionRate: parseFloat(completionRate)
            };
        });

        // Sort by completion rate, then by total tasks
        performance.sort((a, b) => {
            if (b.completionRate !== a.completionRate) {
                return b.completionRate - a.completionRate;
            }
            return b.totalTasks - a.totalTasks;
        });

        // Return top performers
        res.json(performance.slice(0, limit));
    } catch (error) {
        console.error('Error fetching user performance:', error);
        res.status(500).json({ error: 'Failed to fetch user performance' });
    }
});

// GET /api/analytics/activity/recent?limit=20
// Returns recent user activities
router.get('/activity/recent', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const limit = parseInt(req.query.limit) || 20;

        // Build filter based on role
        let whereClause = {};

        if (userRole === 'ADMIN' || userRole === 'COMPANY_ADMIN') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { companyId: true }
            });
            whereClause.companyId = user.companyId;
        }

        // Fetch recent tasks with status changes
        const recentTasks = await prisma.task.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' },
            take: limit,
            select: {
                id: true,
                title: true,
                status: true,
                updatedAt: true,
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true
                    }
                }
            }
        });

        // Format activities
        const activities = recentTasks.map(task => {
            let action = 'updated task';
            if (task.status === 'COMPLETED') {
                action = 'completed task';
            } else if (task.status === 'IN_PROGRESS') {
                action = 'started task';
            } else if (task.status === 'CANCELLED') {
                action = 'cancelled task';
            }

            return {
                userId: task.assignedTo?.id,
                userName: task.assignedTo?.name || 'Unknown',
                personalId: task.assignedTo?.personalId,
                action,
                taskId: task.id,
                taskTitle: task.title,
                timestamp: task.updatedAt
            };
        });

        res.json(activities);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

// GET /api/analytics/tasks/calendar?month=YYYY-MM
// Returns task count per day for calendar heatmap
router.get('/tasks/calendar', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Parse month parameter or use current month
        const monthParam = req.query.month;
        let year, month;

        if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
            [year, month] = monthParam.split('-').map(Number);
        } else {
            const now = new Date();
            year = now.getFullYear();
            month = now.getMonth() + 1;
        }

        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Build filter based on role
        let whereClause = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };

        if (userRole === 'DRIVER') {
            whereClause.assignedToId = userId;
        } else if (userRole === 'ADMIN' || userRole === 'COMPANY_ADMIN') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { companyId: true }
            });
            whereClause.companyId = user.companyId;
        }

        // Fetch tasks in month
        const tasks = await prisma.task.findMany({
            where: whereClause,
            select: {
                createdAt: true
            }
        });

        // Group by date
        const calendarData = [];
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = date.toISOString().split('T')[0];

            const count = tasks.filter(t => {
                const taskDate = new Date(t.createdAt).toISOString().split('T')[0];
                return taskDate === dateStr;
            }).length;

            calendarData.push({
                date: dateStr,
                count
            });
        }

        res.json(calendarData);
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
});

export default router;

