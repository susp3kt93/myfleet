// Push Token Registration Routes
import express from 'express';
import prisma from "../lib/prisma.js";
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// POST /push-token - Register or update push token
// ============================================
router.post('/', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Push token is required' });
        }

        // Update user's push token
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { pushToken: token },
            select: {
                id: true,
                name: true,
                pushToken: true,
                pushNotifications: true
            }
        });

        console.log(`[Push Token] Registered token for user ${req.user.name}: ${token.substring(0, 20)}...`);

        res.json({
            success: true,
            message: 'Push token registered successfully',
            pushNotificationsEnabled: updatedUser.pushNotifications
        });
    } catch (error) {
        console.error('[POST /push-token] Error:', error);
        res.status(500).json({ error: 'Failed to register push token' });
    }
});

// ============================================
// DELETE /push-token - Remove push token (logout/disable)
// ============================================
router.delete('/', async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { pushToken: null }
        });

        console.log(`[Push Token] Removed token for user ${req.user.name}`);

        res.json({
            success: true,
            message: 'Push token removed successfully'
        });
    } catch (error) {
        console.error('[DELETE /push-token] Error:', error);
        res.status(500).json({ error: 'Failed to remove push token' });
    }
});

// ============================================
// PUT /push-token/settings - Update notification preferences
// ============================================
router.put('/settings', async (req, res) => {
    try {
        const { pushNotifications, emailNotifications } = req.body;

        const updateData = {};
        if (typeof pushNotifications === 'boolean') {
            updateData.pushNotifications = pushNotifications;
        }
        if (typeof emailNotifications === 'boolean') {
            updateData.emailNotifications = emailNotifications;
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                pushNotifications: true,
                emailNotifications: true
            }
        });

        res.json({
            success: true,
            settings: {
                pushNotifications: updatedUser.pushNotifications,
                emailNotifications: updatedUser.emailNotifications
            }
        });
    } catch (error) {
        console.error('[PUT /push-token/settings] Error:', error);
        res.status(500).json({ error: 'Failed to update notification settings' });
    }
});

export default router;
