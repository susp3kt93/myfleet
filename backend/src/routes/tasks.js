import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendCompleteNotification } from '../services/notificationService.js';
import * as mapsService from '../services/mapsService.js';
import { sendTaskAssignedEmail } from '../services/emailService.js';
import { sendTaskAssignedNotification } from '../services/pushNotificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get tasks (filtered by role and company)
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        const where = {};

        // Company filtering for non-SUPER_ADMIN
        if (req.user.role !== 'SUPER_ADMIN' && req.user.companyId) {
            where.companyId = req.user.companyId;
        }

        // Drivers see:
        // 1. All tasks assigned to them (any status)
        // 2. All PENDING tasks with no assignment (marketplace) from their company
        if (req.user.role === 'DRIVER') {
            console.log(`[GET /tasks] Driver ${req.user.personalId} requesting tasks`);
            where.OR = [
                { assignedToId: req.user.id }, // My tasks
                {
                    AND: [
                        { status: 'PENDING' },
                        { assignedToId: null }, // Available tasks
                        { companyId: req.user.companyId } // From my company only
                    ]
                }
            ];
        }

        // Filter by date range
        if (startDate || endDate) {
            where.scheduledDate = {};
            if (startDate) where.scheduledDate.gte = new Date(startDate);
            if (endDate) where.scheduledDate.lte = new Date(endDate);
        }

        // Filter by status
        if (status) {
            where.status = status;
        }

        console.log('[GET /tasks] Query where:', JSON.stringify(where, null, 2));

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        photoUrl: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { scheduledDate: 'asc' }
        });

        console.log(`[GET / tasks] Found ${tasks.length} tasks for ${req.user.role} ${req.user.personalId} `);
        if (req.user.role === 'DRIVER') {
            const unassigned = tasks.filter(t => !t.assignedToId && t.status === 'PENDING');
            const myTasks = tasks.filter(t => t.assignedToId === req.user.id);
            console.log(`  - ${unassigned.length} unassigned PENDING tasks`);
            console.log(`  - ${myTasks.length} tasks assigned to me`);
        }

        res.json({ tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get single task
router.get('/:id', async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        email: true,
                        phone: true,
                        photoUrl: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Drivers can only see their own tasks
        if (req.user.role === 'DRIVER' && task.assignedToId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ task });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// Create task (admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        console.log('Task creation request received:', req.body);
        const { title, description, scheduledDate, scheduledTime, price, assignedToId, location, notes } = req.body;

        if (!title || !scheduledDate || price === undefined) {
            console.log('Validation failed:', { title, scheduledDate, price });
            return res.status(400).json({ error: 'Title, scheduled date, and price are required' });
        }

        console.log('Creating task with data:', { title, description, scheduledDate, scheduledTime, price, assignedToId, location, notes });

        // Geocode location if provided
        let latitude = null;
        let longitude = null;
        if (location) {
            try {
                const coords = await mapsService.geocodeAddress(location);
                if (coords) {
                    latitude = coords.lat;
                    longitude = coords.lng;
                    console.log(`Geocoded location: ${location} → (${latitude}, ${longitude})`);
                }
            } catch (error) {
                console.warn('Geocoding failed:', error.message);
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                scheduledDate: new Date(scheduledDate),
                scheduledTime,
                price: parseFloat(price),
                assignedToId: assignedToId || null,
                location,
                latitude,
                longitude,
                notes,
                companyId: req.user.companyId, // Assign to user's company
                createdById: req.user.id
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        email: true,
                        photoUrl: true,
                        pushToken: true,
                        notificationsEnabled: true,
                        emailNotifications: true,
                        pushNotifications: true
                    }
                }
            }
        });

        // Send notification to assigned driver
        if (task.assignedTo) {
            try {
                const date = new Date(task.scheduledDate).toLocaleDateString('ro-RO');

                // In-app notification
                await sendCompleteNotification(
                    task.assignedTo.id,
                    '🎯 Task Nou Atribuit',
                    `Ai primit un task nou: ${task.title}`,
                    'Task Nou Atribuit - MyFleet',
                    `
                        <h2>Bună ${task.assignedTo.name}!</h2>
                        <p>Ți-a fost atribuit un task nou:</p>
                        <h3>${task.title}</h3>
                        <p><strong>Data:</strong> ${date}</p>
                        ${task.scheduledTime ? `<p><strong>Ora:</strong> ${task.scheduledTime}</p>` : ''}
                        ${task.location ? `<p><strong>Locație:</strong> ${task.location}</p>` : ''}
                        <p><strong>Preț:</strong> ${task.price} RON</p>
                        <p>Conectează-te la aplicație pentru mai multe detalii.</p>
                    `,
                    { taskId: task.id, type: 'TASK_ASSIGNED' }
                );
                console.log(`In-app notification sent to driver ${task.assignedTo.name}`);

                // Email notification (if enabled)
                if (task.assignedTo.emailNotifications && task.assignedTo.email) {
                    await sendTaskAssignedEmail(
                        task.assignedTo.email,
                        task.assignedTo.name,
                        task.title,
                        date,
                        task.location
                    );
                    console.log(`Email notification sent to ${task.assignedTo.email}`);
                }

                // Push notification (if enabled and token exists)
                if (task.assignedTo.pushNotifications && task.assignedTo.pushToken) {
                    await sendTaskAssignedNotification(
                        task.assignedTo.pushToken,
                        task.title,
                        date
                    );
                    console.log(`Push notification sent to ${task.assignedTo.name}`);
                }

            } catch (error) {
                console.error('Failed to send notification:', error);
            }
        }

        console.log('Task created successfully:', task.id);
        res.status(201).json({ task });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task', details: error.message });
    }
});

// Update task
router.put('/:id', async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Drivers can only update status of their own tasks
        if (req.user.role === 'DRIVER') {
            if (task.assignedToId !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            // Drivers can only update status
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }

            const updatedTask = await prisma.task.update({
                where: { id: req.params.id },
                data: { status },
                include: {
                    assignedTo: {
                        select: {
                            id: true,
                            personalId: true,
                            name: true,
                            photoUrl: true
                        }
                    }
                }
            });

            return res.json({ task: updatedTask });
        }

        // Admins can update everything
        const { title, description, scheduledDate, scheduledTime, price, assignedToId, location, notes, status } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate);
        if (scheduledTime !== undefined) updateData.scheduledTime = scheduledTime;
        if (price !== undefined) updateData.price = price;
        if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
        if (location !== undefined) updateData.location = location;
        if (notes !== undefined) updateData.notes = notes;
        if (status !== undefined) updateData.status = status;

        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        photoUrl: true
                    }
                }
            }
        });

        res.json({ task: updatedTask });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Accept task
router.post('/:id/accept', async (req, res) => {
    try {
        console.log(`[POST / tasks /: id / accept] User ${req.user.personalId} accepting task ${req.params.id} `);

        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        });

        if (!task) {
            console.log('[POST /tasks/:id/accept] Task not found');
            return res.status(404).json({ error: 'Task not found' });
        }

        console.log(`[POST / tasks /: id / accept] Task status: ${task.status}, assignedToId: ${task.assignedToId} `);

        // Only drivers can accept tasks
        if (req.user.role !== 'DRIVER') {
            console.log('[POST /tasks/:id/accept] Only drivers can accept tasks');
            return res.status(403).json({ error: 'Only drivers can accept tasks' });
        }

        // Can only accept PENDING tasks
        if (task.status !== 'PENDING') {
            console.log('[POST /tasks/:id/accept] Task is not PENDING');
            return res.status(400).json({ error: 'Can only accept pending tasks' });
        }

        // If task is unassigned, anyone can accept
        // If task is assigned, only that driver can accept
        if (task.assignedToId && task.assignedToId !== req.user.id) {
            console.log('[POST /tasks/:id/accept] Task is assigned to another driver');
            return res.status(403).json({ error: 'This task is assigned to another driver' });
        }

        console.log('[POST /tasks/:id/accept] Updating task to ACCEPTED');
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                status: 'ACCEPTED',
                assignedToId: req.user.id // Assign to current driver
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        photoUrl: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        pushToken: true,
                        notificationsEnabled: true
                    }
                }
            }
        });

        // Notify admin that task was accepted
        try {
            const admin = updatedTask.createdBy;
            if (admin) {
                await sendCompleteNotification(
                    admin.id,
                    '✅ Task Acceptat',
                    `${req.user.name} a acceptat task-ul: ${updatedTask.title}`,
                    'Task Acceptat - MyFleet',
                    `
                        <h2>Task Acceptat</h2>
                        <p>Șoferul ${req.user.name} a acceptat task-ul:</p>
                        <h3>${updatedTask.title}</h3>
                        <p><strong>Data:</strong> ${new Date(updatedTask.scheduledDate).toLocaleDateString('ro-RO')}</p>
                        <p><strong>Preț:</strong> ${updatedTask.price} RON</p>
                    `,
                    { taskId: updatedTask.id, type: 'TASK_ACCEPTED' }
                );
            }
        } catch (error) {
            console.error('Failed to send notification to admin:', error);
        }

        console.log(`[POST / tasks /: id / accept] Task accepted successfully by ${req.user.personalId} `);
        res.json({ task: updatedTask });
    } catch (error) {
        console.error('[POST /tasks/:id/accept] Error:', error);
        res.status(500).json({ error: 'Failed to accept task', details: error.message });
    }
});

// Reject task
router.post('/:id/reject', async (req, res) => {
    try {
        console.log(`[POST / tasks /: id / reject] User ${req.user.personalId} rejecting task ${req.params.id} `);

        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        });

        if (!task) {
            console.log('[POST /tasks/:id/reject] Task not found');
            return res.status(404).json({ error: 'Task not found' });
        }

        console.log(`[POST / tasks /: id / reject] Task status: ${task.status}, assignedToId: ${task.assignedToId} `);

        // Only drivers can reject tasks
        if (req.user.role !== 'DRIVER') {
            console.log('[POST /tasks/:id/reject] Only drivers can reject tasks');
            return res.status(403).json({ error: 'Only drivers can reject tasks' });
        }

        // Can reject PENDING or ACCEPTED tasks
        if (task.status !== 'PENDING' && task.status !== 'ACCEPTED') {
            console.log('[POST /tasks/:id/reject] Task is not PENDING or ACCEPTED');
            return res.status(400).json({ error: 'Can only reject pending or accepted tasks' });
        }

        // If rejecting an ACCEPTED task, must be assigned to current driver
        if (task.status === 'ACCEPTED' && task.assignedToId !== req.user.id) {
            console.log('[POST /tasks/:id/reject] Cannot reject another driver\'s accepted task');
            return res.status(403).json({ error: 'Cannot reject another driver\'s task' });
        }

        // If rejecting a PENDING task that's assigned, must be assigned to current driver
        if (task.status === 'PENDING' && task.assignedToId && task.assignedToId !== req.user.id) {
            console.log('[POST /tasks/:id/reject] Cannot reject another driver\'s pending task');
            return res.status(403).json({ error: 'Cannot reject another driver\'s task' });
        }

        console.log('[POST /tasks/:id/reject] Updating task to PENDING and returning to marketplace');
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                status: 'PENDING', // Return to marketplace so other drivers can accept
                assignedToId: null // Unassign from current driver
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        photoUrl: true
                    }
                }
            }
        });

        // Apply rating penalty for rejecting ACCEPTED task
        if (task.status === 'ACCEPTED' && task.assignedToId) {
            const currentUser = await prisma.user.findUnique({
                where: { id: task.assignedToId },
                select: { rating: true }
            });

            const ratingChange = -0.05;
            let newRating = (currentUser.rating || 3.0) + ratingChange;
            newRating = Math.max(1.0, Math.min(5.0, newRating));
            newRating = Math.round(newRating * 100) / 100;

            await prisma.user.update({
                where: { id: task.assignedToId },
                data: { rating: newRating }
            });

            console.log(`[POST /tasks/:id/reject] Driver rating updated: ${currentUser.rating} → ${newRating} (-0.05 for rejecting accepted task)`);
        }

        console.log(`[POST /tasks/:id/reject] Task rejected successfully by ${req.user.personalId}`);

        // Notify admin that task was rejected
        try {
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (admin) {
                await sendCompleteNotification(
                    admin.id,
                    '❌ Task Respins',
                    `${req.user.name} a respins task-ul: ${updatedTask.title}`,
                    'Task Respins - MyFleet',
                    `
                        <h2>Task Respins</h2>
                        <p>Șoferul ${req.user.name} a respins task-ul:</p>
                        <h3>${updatedTask.title}</h3>
                        <p>Task-ul este acum disponibil în marketplace pentru alți șoferi.</p>
                    `,
                    { taskId: updatedTask.id, type: 'TASK_REJECTED' }
                );
            }
        } catch (error) {
            console.error('Failed to send notification to admin:', error);
        }

        res.json({ task: updatedTask });
    } catch (error) {
        console.error('[POST /tasks/:id/reject] Error:', error);
        res.status(500).json({ error: 'Failed to reject task', details: error.message });
    }
});

// Cancel accepted task (driver only, with rating penalty)
router.post('/:id/cancel', async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Only drivers can cancel their own tasks
        if (req.user.role !== 'DRIVER' || task.assignedToId !== req.user.id) {
            return res.status(403).json({ error: 'You can only cancel your own tasks' });
        }

        // Can only cancel ACCEPTED tasks
        if (task.status !== 'ACCEPTED') {
            return res.status(400).json({ error: 'Can only cancel accepted tasks' });
        }

        // Update task status to PENDING and decrease driver rating
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                status: 'PENDING',
                assignedToId: null // Unassign from driver
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        photoUrl: true
                    }
                }
            }
        });

        // Decrease driver's rating by 0.1
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                rating: {
                    decrement: 0.1
                }
            }
        });

        // Notify admin that task was cancelled
        try {
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (admin) {
                await sendCompleteNotification(
                    admin.id,
                    '⚠️ Task Anulat',
                    `${req.user.name} a anulat task-ul: ${updatedTask.title}`,
                    'Task Anulat - MyFleet',
                    `
                        <h2>Task Anulat</h2>
                        <p>Șoferul ${req.user.name} a anulat task-ul acceptat:</p>
                        <h3>${updatedTask.title}</h3>
                        <p>Rating-ul șoferului a fost scăzut cu 0.1 puncte.</p>
                        <p>Task-ul este acum disponibil în marketplace.</p>
                    `,
                    { taskId: updatedTask.id, type: 'TASK_CANCELLED' }
                );
            }
        } catch (error) {
            console.error('Failed to send notification to admin:', error);
        }

        res.json({ task: updatedTask, message: 'Task cancelled. Rating decreased by 0.1' });
    } catch (error) {
        console.error('Cancel task error:', error);
        res.status(500).json({ error: 'Failed to cancel task' });
    }
});

// Complete task
router.post('/:id/complete', async (req, res) => {
    try {
        console.log(`[POST / tasks /: id / complete] User ${req.user.personalId} completing task ${req.params.id} `);

        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        });

        if (!task) {
            console.log('[POST /tasks/:id/complete] Task not found');
            return res.status(404).json({ error: 'Task not found' });
        }

        // Only assigned driver or admin can complete
        if (req.user.role === 'DRIVER' && task.assignedToId !== req.user.id) {
            console.log('[POST /tasks/:id/complete] Not authorized');
            return res.status(403).json({ error: 'Not authorized to complete this task' });
        }

        const completionDate = new Date();
        const scheduledDate = new Date(task.scheduledDate);

        // Calculate rating change based on completion time
        let ratingChange = 0;
        let ratingReason = '';

        // Compare dates (ignore time)
        const completionDay = new Date(completionDate);
        completionDay.setHours(0, 0, 0, 0);
        const scheduledDay = new Date(scheduledDate);
        scheduledDay.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((completionDay - scheduledDay) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
            // Completed before scheduled date (early)
            ratingChange = 0.15;
            ratingReason = 'Task completed early';
        } else if (daysDiff === 0) {
            // Completed on scheduled date (on time)  
            ratingChange = 0.1;
            ratingReason = 'Task completed on time';
        } else {
            // Completed after scheduled date (late)
            ratingChange = -0.2;
            ratingReason = 'Task completed late';
        }

        console.log(`[POST / tasks /: id / complete] Rating change: ${ratingChange} (${ratingReason})`);

        // Update task status
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                status: 'COMPLETED',
                completedAt: completionDate,
                actualEarnings: task.price // Default actual earnings to agreed price
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        photoUrl: true,
                        rating: true
                    }
                }
            }
        });

        // Apply rating change for the driver
        if (task.assignedToId && ratingChange !== 0) {
            const currentUser = await prisma.user.findUnique({
                where: { id: task.assignedToId },
                select: { rating: true }
            });

            let newRating = (currentUser.rating || 3.0) + ratingChange;
            newRating = Math.max(1.0, Math.min(5.0, newRating));
            newRating = Math.round(newRating * 100) / 100;

            await prisma.user.update({
                where: { id: task.assignedToId },
                data: { rating: newRating }
            });

            console.log(`[POST / tasks /: id / complete] Driver rating updated: ${currentUser.rating} → ${newRating} `);
        }

        console.log('[POST /tasks/:id/complete] Task completed successfully');

        // Notify admin that task was completed
        try {
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (admin) {
                await sendCompleteNotification(
                    admin.id,
                    '🎉 Task Completat',
                    `${req.user.name} a completat task-ul: ${updatedTask.title}`,
                    'Task Completat - MyFleet',
                    `
                        <h2>Task Completat</h2>
                        <p>Șoferul ${req.user.name} a completat cu succes task-ul:</p>
                        <h3>${updatedTask.title}</h3>
                        <p><strong>Câștig:</strong> ${task.price} RON</p>
                        <p><strong>Rating change:</strong> ${ratingChange > 0 ? '+' : ''}${ratingChange} (${ratingReason})</p>
                    `,
                    { taskId: updatedTask.id, type: 'TASK_COMPLETED' }
                );
            }
        } catch (error) {
            console.error('Failed to send notification to admin:', error);
        }

        res.json({ task: updatedTask, ratingChange, ratingReason });
    } catch (error) {
        console.error('[POST /tasks/:id/complete] Error:', error);
        res.status(500).json({ error: 'Failed to complete task', details: error.message });
    }
});

// Delete task (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await prisma.task.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
