import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { addCompanyFilter, checkDriverLimit } from '../middleware/permissions.js';

const router = express.Router();

// All user routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);
router.use(addCompanyFilter);

// Get all users (filtered by company for non-SUPER_ADMIN)
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: req.companyFilter, // Filters by company for COMPANY_ADMIN
            select: {
                id: true,
                personalId: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                photoUrl: true,
                isActive: true,
                companyId: true,
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
router.post('/', checkDriverLimit, async (req, res) => {
    try {
        const { personalId, password, name, email, phone, role, photoUrl } = req.body;

        if (!personalId || !password || !name) {
            return res.status(400).json({ error: 'Personal ID, password, and name are required' });
        }

        // Check if personalId already exists
        const existingById = await prisma.user.findUnique({
            where: { personalId }
        });

        if (existingById) {
            return res.status(400).json({ error: 'Personal ID already exists' });
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingByEmail = await prisma.user.findUnique({
                where: { email }
            });

            if (existingByEmail) {
                return res.status(400).json({ error: 'Email already exists. Please use a different email address.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Automatically assign companyId for COMPANY_ADMIN, SUPER_ADMIN can specify
        const companyId = req.user.role === 'SUPER_ADMIN' ? req.body.companyId : req.user.companyId;

        const user = await prisma.user.create({
            data: {
                personalId,
                password: hashedPassword,
                name,
                email: email || null,
                phone,
                role: role || 'DRIVER',
                companyId,
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
        // Handle unique constraint violations
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'field';
            return res.status(400).json({ error: `${field} already exists` });
        }
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
