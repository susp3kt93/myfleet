import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get all deductions (filtered by query params)
router.get('/', async (req, res) => {
    try {
        const { userId, companyId, status, type } = req.query;
        const userRole = req.user.role;

        // Build where clause based on role and filters
        const where = {};

        // Super Admin can see all, Company Admin sees their company, Driver sees only theirs
        if (userRole === 'DRIVER') {
            where.userId = req.user.id;
        } else if (userRole === 'ADMIN') {
            where.companyId = req.user.companyId;
            if (userId) where.userId = userId;
        } else if (userRole === 'SUPER_ADMIN') {
            if (companyId) where.companyId = companyId;
            if (userId) where.userId = userId;
        }

        if (status) where.status = status;
        if (type) where.type = type;

        const deductions = await prisma.deduction.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        personalId: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ deductions });
    } catch (error) {
        console.error('Get deductions error:', error);
        res.status(500).json({ error: 'Failed to fetch deductions' });
    }
});

// Get single deduction
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deduction = await prisma.deduction.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        personalId: true
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

        if (!deduction) {
            return res.status(404).json({ error: 'Deduction not found' });
        }

        // Authorization check
        if (req.user.role === 'DRIVER' && deduction.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        if (req.user.role === 'ADMIN' && deduction.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json({ deduction });
    } catch (error) {
        console.error('Get deduction error:', error);
        res.status(500).json({ error: 'Failed to fetch deduction' });
    }
});

// Create new deduction (Admin/Super Admin only)
router.post('/', async (req, res) => {
    try {
        if (req.user.role === 'DRIVER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const {
            userId,
            type,
            description,
            amount,
            frequency,
            startDate,
            endDate
        } = req.body;

        // Validation
        if (!userId || !type || !description || !amount || !frequency || !startDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get user to verify company
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { companyId: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Company Admin can only create deductions for their company
        if (req.user.role === 'ADMIN' && user.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const deduction = await prisma.deduction.create({
            data: {
                userId,
                companyId: user.companyId,
                type,
                description,
                amount: parseFloat(amount),
                frequency,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                createdById: req.user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        personalId: true
                    }
                }
            }
        });

        res.status(201).json({ deduction });
    } catch (error) {
        console.error('Create deduction error:', error);
        res.status(500).json({ error: 'Failed to create deduction' });
    }
});

// Update deduction (Admin/Super Admin only)
router.put('/:id', async (req, res) => {
    try {
        if (req.user.role === 'DRIVER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const {
            description,
            amount,
            frequency,
            startDate,
            endDate,
            status
        } = req.body;

        // Check if deduction exists and user has permission
        const existing = await prisma.deduction.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Deduction not found' });
        }

        if (req.user.role === 'ADMIN' && existing.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updateData = {};
        if (description !== undefined) updateData.description = description;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (frequency !== undefined) updateData.frequency = frequency;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (status !== undefined) updateData.status = status;

        const deduction = await prisma.deduction.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        personalId: true
                    }
                }
            }
        });

        res.json({ deduction });
    } catch (error) {
        console.error('Update deduction error:', error);
        res.status(500).json({ error: 'Failed to update deduction' });
    }
});

// Delete deduction (Admin/Super Admin only)
router.delete('/:id', async (req, res) => {
    try {
        if (req.user.role === 'DRIVER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check if deduction exists and user has permission
        const existing = await prisma.deduction.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Deduction not found' });
        }

        if (req.user.role === 'ADMIN' && existing.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.deduction.delete({
            where: { id }
        });

        res.json({ message: 'Deduction deleted successfully' });
    } catch (error) {
        console.error('Delete deduction error:', error);
        res.status(500).json({ error: 'Failed to delete deduction' });
    }
});

export default router;
