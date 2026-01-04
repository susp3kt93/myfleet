import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin, requireCompanyAdmin, canManageCompany } from '../middleware/permissions.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/companies
 * List all companies (SUPER_ADMIN only)
 */
router.get('/', requireSuperAdmin, async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        tasks: true,
                        vehicles: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

/**
 * GET /api/companies/:id
 * Get company details
 * SUPER_ADMIN: any company
 * COMPANY_ADMIN: their own company only
 */
router.get('/:id', requireCompanyAdmin, canManageCompany, async (req, res) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: req.params.id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true
                    }
                },
                _count: {
                    select: {
                        users: true,
                        tasks: true,
                        vehicles: true,
                        messages: true
                    }
                }
            }
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
});

/**
 * POST /api/companies
 * Create new company (SUPER_ADMIN only)
 */
router.post('/', requireSuperAdmin, async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            address,
            taxId,
            plan = 'FREE',
            maxDrivers = 5,
            maxVehicles = 5
        } = req.body;

        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if email already exists
        const existingCompany = await prisma.company.findUnique({
            where: { email }
        });

        if (existingCompany) {
            return res.status(409).json({ error: 'Company with this email already exists' });
        }

        const company = await prisma.company.create({
            data: {
                name,
                email,
                phone,
                address,
                taxId,
                plan,
                maxDrivers: parseInt(maxDrivers),
                maxVehicles: parseInt(maxVehicles)
            }
        });

        res.status(201).json(company);
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});

/**
 * PUT /api/companies/:id
 * Update company
 * SUPER_ADMIN: any company
 * COMPANY_ADMIN: their own company only
 */
router.put('/:id', requireCompanyAdmin, canManageCompany, async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            address,
            taxId,
            logo,
            plan,
            maxDrivers,
            maxVehicles,
            isActive
        } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (taxId !== undefined) updateData.taxId = taxId;
        if (logo !== undefined) updateData.logo = logo;

        // Only SUPER_ADMIN can update subscription settings
        if (req.user.role === 'SUPER_ADMIN') {
            // If plan is being changed, auto-update limits based on new plan
            if (plan !== undefined) {
                // Fetch current company to check if plan actually changed
                const currentCompany = await prisma.company.findUnique({
                    where: { id: req.params.id },
                    select: { plan: true }
                });

                const { getPlan } = await import('../config/plans.js');
                const planConfig = getPlan(plan);

                if (!planConfig) {
                    return res.status(400).json({ error: 'Invalid plan specified' });
                }

                updateData.plan = plan;

                // If plan actually changed, auto-update limits from plan config
                // Otherwise use manual overrides if provided
                if (currentCompany && currentCompany.plan !== plan) {
                    // Plan changed - auto-set limits from new plan config
                    updateData.maxDrivers = planConfig.limits.maxDrivers;
                    updateData.maxVehicles = planConfig.limits.maxVehicles;
                    console.log(`Plan changed from ${currentCompany.plan} to ${plan}, auto-updating limits to ${planConfig.limits.maxDrivers}/${planConfig.limits.maxVehicles}`);
                } else {
                    // Plan not changed - use manual overrides if provided
                    if (maxDrivers !== undefined) updateData.maxDrivers = parseInt(maxDrivers);
                    if (maxVehicles !== undefined) updateData.maxVehicles = parseInt(maxVehicles);
                }
            } else {
                // Plan not specified, just update manual overrides if provided
                if (maxDrivers !== undefined) updateData.maxDrivers = parseInt(maxDrivers);
                if (maxVehicles !== undefined) updateData.maxVehicles = parseInt(maxVehicles);
            }

            if (isActive !== undefined) updateData.isActive = isActive;
        }

        const company = await prisma.company.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(company);
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Failed to update company' });
    }
});

/**
 * DELETE /api/companies/:id
 * Delete company (SUPER_ADMIN only)
 * WARNING: This will cascade delete all company data
 */
router.delete('/:id', requireSuperAdmin, async (req, res) => {
    try {
        await prisma.company.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Failed to delete company' });
    }
});

/**
 * GET /api/companies/:id/stats
 * Get company statistics
 */
router.get('/:id/stats', requireCompanyAdmin, canManageCompany, async (req, res) => {
    try {
        const companyId = req.params.id;

        // Get counts
        const [users, tasks, vehicles, activeDrivers, pendingTasks, completedTasks] = await Promise.all([
            prisma.user.count({ where: { companyId } }),
            prisma.task.count({ where: { companyId } }),
            prisma.vehicle.count({ where: { companyId } }),
            prisma.user.count({ where: { companyId, role: 'DRIVER', isActive: true } }),
            prisma.task.count({ where: { companyId, status: 'PENDING' } }),
            prisma.task.count({ where: { companyId, status: 'COMPLETED' } })
        ]);

        // Get total earnings
        // Get total earnings
        const earningsResult = await prisma.task.aggregate({
            where: { companyId, status: 'COMPLETED' },
            _sum: { actualEarnings: true }
        });

        // Get monthly history for chart (Last 6 months)
        const now = new Date();
        const monthlyHistory = [];
        const monthNames = [
            'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
            'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
        ];

        for (let i = 0; i < 6; i++) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 1);

            const monthStats = await prisma.task.aggregate({
                where: {
                    companyId: companyId,
                    status: 'COMPLETED',
                    scheduledDate: {
                        gte: firstDay,
                        lt: lastDay
                    }
                },
                _sum: { actualEarnings: true },
                _count: { id: true }
            });

            const monthEarnings = monthStats._sum.actualEarnings || 0;
            const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

            monthlyHistory.push({
                month: monthStr,
                year: year,
                monthName: monthNames[month],
                earnings: monthEarnings,
                taskCount: monthStats._count.id
            });
        }

        const stats = {
            users,
            drivers: users - 1, // Exclude company admin(s)
            activeDrivers,
            tasks,
            pendingTasks,
            completedTasks,
            vehicles,
            pendingTasks,
            completedTasks,
            vehicles,
            totalEarnings: earningsResult._sum.actualEarnings || 0,
            monthlyHistory // Add history to response
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching company stats:', error);
        res.status(500).json({ error: 'Failed to fetch company statistics' });
    }
});

export default router;
