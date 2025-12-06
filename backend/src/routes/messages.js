import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get messages for current user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        const messages = await prisma.message.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send message
router.post('/', async (req, res) => {
    try {
        const { content, toUserId } = req.body;
        const fromAdmin = req.user.role === 'ADMIN';
        const userId = toUserId || req.user.id;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const message = await prisma.message.create({
            data: {
                content,
                userId,
                fromAdmin
            }
        });

        res.status(201).json({ message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
    try {
        const message = await prisma.message.update({
            where: { id: req.params.id },
            data: { isRead: true }
        });

        res.json({ message });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});

// Delete message
router.delete('/:id', async (req, res) => {
    try {
        await prisma.message.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

export default router;
