import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All user routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                personalId: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                photoUrl: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        assignedTasks: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                personalId: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                photoUrl: true,
                isActive: true,
                createdAt: true,
                assignedTasks: {
                    take: 10,
                    orderBy: { scheduledDate: 'desc' }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Create new user
router.post('/', async (req, res) => {
    try {
        const { personalId, password, name, email, phone, role, photoUrl } = req.body;

        if (!personalId || !password || !name) {
            return res.status(400).json({ error: 'Personal ID, password, and name are required' });
        }

        // Check if personalId already exists
        const existing = await prisma.user.findUnique({
            where: { personalId }
        });

        if (existing) {
            return res.status(400).json({ error: 'Personal ID already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                personalId,
                password: hashedPassword,
                name,
                email,
                phone,
                role: role || 'DRIVER',
                photoUrl
            },
            select: {
                id: true,
                personalId: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                photoUrl: true,
                isActive: true,
                createdAt: true
            }
        });

        res.status(201).json({ user });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, role, photoUrl, isActive, password } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (role !== undefined) updateData.role = role;
        if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: {
                id: true,
                personalId: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                photoUrl: true,
                isActive: true,
                createdAt: true
            }
        });

        res.json({ user });
    } catch (error) {
        console.error('Update user error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        // Prevent deleting yourself
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await prisma.user.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
