import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

/**
 * Register or update push notification token
 */
router.post('/register-token', authenticate, async (req, res) => {
    try {
        const { pushToken } = req.body;
        const userId = req.user.id;

        if (!pushToken) {
            return res.status(400).json({ error: 'Push token is required' });
        }

        // Update user's push token
        await prisma.user.update({
            where: { id: userId },
            data: { pushToken }
        });

        console.log(`[Notifications] Registered push token for user ${userId}`);
        res.json({ success: true, message: 'Push token registered successfully' });

    } catch (error) {
        console.error('[Notifications] Error registering push token:', error);
        res.status(500).json({ error: 'Failed to register push token' });
    }
});

/**
 * Update notification preferences
 */
router.put('/preferences', authenticate, async (req, res) => {
    try {
        const { emailNotifications, pushNotifications } = req.body;
        const userId = req.user.id;

        const updateData = {};
        if (typeof emailNotifications === 'boolean') {
            updateData.emailNotifications = emailNotifications;
        }
        if (typeof pushNotifications === 'boolean') {
            updateData.pushNotifications = pushNotifications;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                emailNotifications: true,
                pushNotifications: true,
            }
        });

        res.json({ success: true, preferences: user });

    } catch (error) {
        console.error('[Notifications] Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

/**
 * Get notification preferences
 */
router.get('/preferences', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailNotifications: true,
                pushNotifications: true,
                notificationsEnabled: true,
            }
        });

        res.json({ preferences: user });

    } catch (error) {
        console.error('[Notifications] Error fetching preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});

/**
 * Get user's notification history
 */
router.get('/history', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });

        const total = await prisma.notification.count({
            where: { userId }
        });

        res.json({
            notifications,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

    } catch (error) {
        console.error('[Notifications] Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch notification history' });
    }
});

/**
 * Mark notification as read
 */
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.updateMany({
            where: {
                id,
                userId, // Ensure user owns this notification
            },
            data: {
                isRead: true,
                readAt: new Date(),
            }
        });

        if (notification.count === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ success: true });

    } catch (error) {
        console.error('[Notifications] Error marking as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

/**
 * Delete notification
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.deleteMany({
            where: {
                id,
                userId, // Ensure user owns this notification
            }
        });

        if (notification.count === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ success: true });

    } catch (error) {
        console.error('[Notifications] Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

export default router;
