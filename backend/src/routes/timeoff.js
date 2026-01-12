import express from 'express';
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendTimeOffApprovedEmail, sendTimeOffRejectedEmail } from '../services/emailService.js';
import {
    sendTimeOffApprovedNotification,
    sendTimeOffRejectedNotification,
    sendTimeOffDeletedNotification,
    sendTimeOffUpdatedNotification
} from '../services/pushNotificationService.js';

const router = express.Router();

router.use(authenticate);

// ============================================
// GET /timeoff - List time-off requests
// Admin: all company requests, Driver: own requests only
// ============================================
router.get('/', async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        let whereClause = {};

        // Filter by role
        if (req.user.role === 'DRIVER') {
            whereClause.userId = req.user.id;
        } else if (req.user.role === 'COMPANY_ADMIN') {
            whereClause.companyId = req.user.companyId;
        }
        // SUPER_ADMIN can see all

        // Filter by status
        if (status && status !== 'all') {
            whereClause.status = status.toUpperCase();
        }

        // Filter by date range
        if (startDate || endDate) {
            whereClause.requestDate = {};
            if (startDate) {
                whereClause.requestDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.requestDate.lte = new Date(endDate);
            }
        }

        const requests = await prisma.timeOffRequest.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        email: true,
                        photoUrl: true
                    }
                }
            },
            orderBy: [
                { status: 'asc' }, // PENDING first
                { requestDate: 'asc' }
            ]
        });

        res.json(requests);
    } catch (error) {
        console.error('[GET /timeoff] Error:', error);
        res.status(500).json({ error: 'Failed to fetch time-off requests' });
    }
});

// ============================================
// GET /timeoff/pending-count - Get count of pending requests (for admin badge)
// ============================================
router.get('/pending-count', requireAdmin, async (req, res) => {
    try {
        let whereClause = { status: 'PENDING' };

        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;
        const currentCompanyId = req.user.companyId;

        // console.log(`[GET /timeoff/pending-count] Admin: ${req.user.name} | Role: ${currentUserRole} | CompId: ${currentCompanyId}`);

        if (req.user.role === 'COMPANY_ADMIN') {
            whereClause.companyId = req.user.companyId;
        }

        const count = await prisma.timeOffRequest.count({
            where: whereClause
        });

        // console.log(`[GET /timeoff/pending-count] Found count: ${count}`);

        res.json({ count });
    } catch (error) {
        console.error('[GET /timeoff/pending-count] Error:', error);
        res.status(500).json({ error: 'Failed to get pending count' });
    }
});

// ============================================
// GET /timeoff/driver-stats - Get yearly time off stats per driver (Admin only)
// Returns: { drivers: [{ userId, name, personalId, approvedDays, pendingDays, requests }] }
// ============================================
router.get('/driver-stats', requireAdmin, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

        let companyFilter = {};
        if (req.user.role === 'COMPANY_ADMIN') {
            companyFilter.companyId = req.user.companyId;
        }

        // Get all drivers with their time off requests for this year
        const drivers = await prisma.user.findMany({
            where: {
                role: 'DRIVER',
                ...companyFilter
            },
            select: {
                id: true,
                name: true,
                personalId: true,
                timeOffRequests: {
                    where: {
                        requestDate: {
                            gte: yearStart,
                            lte: yearEnd
                        }
                    },
                    select: {
                        id: true,
                        requestDate: true,
                        endDate: true,
                        status: true,
                        reason: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Calculate stats for each driver
        const driverStats = drivers.map(driver => {
            let approvedDays = 0;
            let pendingDays = 0;

            driver.timeOffRequests.forEach(req => {
                const start = new Date(req.requestDate);
                const end = req.endDate ? new Date(req.endDate) : start;
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                if (req.status === 'APPROVED') {
                    approvedDays += days;
                } else if (req.status === 'PENDING') {
                    pendingDays += days;
                }
            });

            return {
                userId: driver.id,
                name: driver.name,
                personalId: driver.personalId,
                approvedDays,
                pendingDays,
                totalRequests: driver.timeOffRequests.length
            };
        });

        res.json({
            year: currentYear,
            drivers: driverStats
        });
    } catch (error) {
        console.error('[GET /timeoff/driver-stats] Error:', error);
        res.status(500).json({ error: 'Failed to get driver stats' });
    }
});

// ============================================
// POST /timeoff - Create a new time-off request (Driver only)
// Supports single day (requestDate) or date range (startDate/requestDate + endDate)
// Creates a SINGLE request covering the entire period
// ============================================
router.post('/', async (req, res) => {
    try {
        if (req.user.role !== 'DRIVER') {
            return res.status(403).json({ error: 'Only drivers can request time off' });
        }

        const { requestDate, startDate, endDate, reason } = req.body;

        // Determine start and end dates
        let start, end;

        if (startDate && endDate) {
            // Date range request (vacation period)
            start = new Date(startDate);
            end = new Date(endDate);
        } else if (requestDate) {
            // Single day request
            start = new Date(requestDate);
            end = null; // No end date for single day
        } else {
            return res.status(400).json({ error: 'Request date or date range is required' });
        }

        start.setHours(0, 0, 0, 0);
        if (end) {
            end.setHours(0, 0, 0, 0);

            if (end < start) {
                return res.status(400).json({ error: 'End date must be after start date' });
            }

            // Calculate number of days
            const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (daysDiff > 60) {
                return res.status(400).json({ error: 'Maximum 60 days per request' });
            }
        }

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            return res.status(400).json({ error: 'Cannot request time off for past dates' });
        }

        // Check for overlapping existing requests
        const existingRequests = await prisma.timeOffRequest.findMany({
            where: {
                userId: req.user.id,
                status: { not: 'REJECTED' },
                OR: [
                    // Single day overlaps with our range
                    {
                        endDate: null,
                        requestDate: {
                            gte: start,
                            lte: end || start
                        }
                    },
                    // Range overlaps with our range
                    {
                        endDate: { not: null },
                        AND: [
                            { requestDate: { lte: end || start } },
                            { endDate: { gte: start } }
                        ]
                    }
                ]
            }
        });

        if (existingRequests.length > 0) {
            const overlaps = existingRequests.map(r => {
                if (r.endDate) {
                    return `${r.requestDate.toISOString().split('T')[0]} to ${r.endDate.toISOString().split('T')[0]}`;
                }
                return r.requestDate.toISOString().split('T')[0];
            }).join(', ');
            return res.status(400).json({
                error: `Overlaps with existing request(s): ${overlaps}`
            });
        }

        // Create single request
        const request = await prisma.timeOffRequest.create({
            data: {
                requestDate: start,
                endDate: end,
                reason: reason || null,
                userId: req.user.id,
                companyId: req.user.companyId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true
                    }
                }
            }
        });

        // Calculate days for response
        const days = end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : 1;

        console.log(`[POST /timeoff] Created request for ${req.user.name}: ${days} day(s) from ${start.toISOString().split('T')[0]}`);

        res.status(201).json({
            ...request,
            days,
            message: days > 1 ? `Created vacation request for ${days} days` : 'Created time off request'
        });
    } catch (error) {
        console.error('[POST /timeoff] Error:', error);
        res.status(500).json({ error: 'Failed to create time-off request' });
    }
});


// ============================================
// PUT /timeoff/:id/approve - Approve a time-off request (Admin only)
// ============================================
router.put('/:id/approve', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const request = await prisma.timeOffRequest.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Check company access for COMPANY_ADMIN
        if (req.user.role === 'COMPANY_ADMIN' && request.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request is not pending' });
        }

        const updated = await prisma.timeOffRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                adminNotes: adminNotes || null,
                respondedAt: new Date(),
                respondedById: req.user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        email: true,
                        pushToken: true,
                        emailNotifications: true,
                        pushNotifications: true
                    }
                }
            }
        });

        const startDate = request.requestDate.toLocaleDateString('ro-RO');
        const endDate = request.endDate ? request.endDate.toLocaleDateString('ro-RO') : null;

        // Create in-app notification for driver
        await prisma.notification.create({
            data: {
                userId: request.userId,
                companyId: request.companyId,
                title: 'Cerere aprobată ✅',
                message: `Cererea ta de liber pentru ${startDate}${endDate ? ` - ${endDate}` : ''} a fost aprobată.`,
                data: JSON.stringify({ type: 'TIME_OFF_APPROVED', requestId: id })
            }
        });

        // Send email notification (if enabled)
        if (updated.user.emailNotifications && updated.user.email) {
            try {
                await sendTimeOffApprovedEmail(
                    updated.user.email,
                    updated.user.name,
                    startDate,
                    endDate
                );
                console.log(`[TimeOff] Email sent to ${updated.user.email}`);
            } catch (e) {
                console.error('[TimeOff] Failed to send email:', e);
            }
        }

        // Send push notification (if enabled)
        if (updated.user.pushNotifications && updated.user.pushToken) {
            try {
                await sendTimeOffApprovedNotification(
                    updated.user.pushToken,
                    startDate,
                    endDate
                );
                console.log(`[TimeOff] Push sent to ${updated.user.name}`);
            } catch (e) {
                console.error('[TimeOff] Failed to send push:', e);
            }
        }

        console.log(`[PUT /timeoff/${id}/approve] Approved by ${req.user.name}`);

        res.json(updated);
    } catch (error) {
        console.error('[PUT /timeoff/:id/approve] Error:', error);
        res.status(500).json({ error: 'Failed to approve request' });
    }
});

// ============================================
// PUT /timeoff/:id/reject - Reject a time-off request (Admin only)
// ============================================
router.put('/:id/reject', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const request = await prisma.timeOffRequest.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Check company access for COMPANY_ADMIN
        if (req.user.role === 'COMPANY_ADMIN' && request.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request is not pending' });
        }

        const updated = await prisma.timeOffRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                adminNotes: adminNotes || null,
                respondedAt: new Date(),
                respondedById: req.user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        email: true,
                        pushToken: true,
                        emailNotifications: true,
                        pushNotifications: true
                    }
                }
            }
        });

        const startDate = request.requestDate.toLocaleDateString('ro-RO');
        const endDate = request.endDate ? request.endDate.toLocaleDateString('ro-RO') : null;

        // Create in-app notification for driver
        await prisma.notification.create({
            data: {
                userId: request.userId,
                companyId: request.companyId,
                title: 'Cerere respinsă ❌',
                message: `Cererea ta de liber pentru ${startDate}${endDate ? ` - ${endDate}` : ''} a fost respinsă.${adminNotes ? ` Motiv: ${adminNotes}` : ''}`,
                data: JSON.stringify({ type: 'TIME_OFF_REJECTED', requestId: id })
            }
        });

        // Send email notification (if enabled)
        if (updated.user.emailNotifications && updated.user.email) {
            try {
                await sendTimeOffRejectedEmail(
                    updated.user.email,
                    updated.user.name,
                    startDate,
                    endDate,
                    adminNotes
                );
                console.log(`[TimeOff] Rejection email sent to ${updated.user.email}`);
            } catch (e) {
                console.error('[TimeOff] Failed to send rejection email:', e);
            }
        }

        // Send push notification (if enabled)
        if (updated.user.pushNotifications && updated.user.pushToken) {
            try {
                await sendTimeOffRejectedNotification(
                    updated.user.pushToken,
                    startDate,
                    endDate
                );
                console.log(`[TimeOff] Rejection push sent to ${updated.user.name}`);
            } catch (e) {
                console.error('[TimeOff] Failed to send rejection push:', e);
            }
        }

        console.log(`[PUT /timeoff/${id}/reject] Rejected by ${req.user.name}`);

        res.json(updated);
    } catch (error) {
        console.error('[PUT /timeoff/:id/reject] Error:', error);
        res.status(500).json({ error: 'Failed to reject request' });
    }
});

// ============================================
// PUT /timeoff/:id/details - Update request details (Admin only)
// ============================================
router.put('/:id/details', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { requestDate, endDate, reason } = req.body;

        const request = await prisma.timeOffRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        pushToken: true,
                        pushNotifications: true,
                        name: true
                    }
                }
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (req.user.role === 'COMPANY_ADMIN' && request.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        let start = requestDate ? new Date(requestDate) : undefined;
        let end = endDate ? new Date(endDate) : undefined;

        // Basic validation if dates provided
        if (start && end) {
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            if (end < start) {
                return res.status(400).json({ error: 'End date must be after start date' });
            }
        }

        const updated = await prisma.timeOffRequest.update({
            where: { id },
            data: {
                requestDate: start,
                endDate: end,
                reason: reason
            }
        });

        // Notify Driver
        const sDate = updated.requestDate.toLocaleDateString('ro-RO');
        const eDate = updated.endDate ? updated.endDate.toLocaleDateString('ro-RO') : null;

        await prisma.notification.create({
            data: {
                userId: request.userId,
                companyId: request.companyId,
                title: 'Cerere Modificată ✏️',
                message: `Admin-ul a modificat detaliile cererii tale pentru ${sDate}.`,
                data: JSON.stringify({ type: 'TIME_OFF_UPDATED', requestId: id })
            }
        });

        if (request.user.pushNotifications && request.user.pushToken) {
            await sendTimeOffUpdatedNotification(request.user.pushToken, sDate, eDate);
        }

        console.log(`[PUT /timeoff/${id}/details] Updated by ${req.user.name}`);
        res.json(updated);

    } catch (error) {
        console.error('[PUT /timeoff/:id/details] Error:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// ============================================
// DELETE /timeoff/:id - Delete request (Driver: pending only / Admin: any)
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const request = await prisma.timeOffRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        pushToken: true,
                        pushNotifications: true,
                        name: true
                    }
                }
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const isAdmin = ['ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

        // Authorization Logic
        if (req.user.role === 'DRIVER') {
            if (request.userId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
            if (request.status !== 'PENDING') return res.status(400).json({ error: 'Only pending requests can be cancelled' });
        } else if (req.user.role === 'COMPANY_ADMIN') {
            if (request.companyId !== req.user.companyId) return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.timeOffRequest.delete({
            where: { id }
        });

        // If Admin deleted, notify driver
        if (isAdmin && request.userId !== req.user.id) {
            const sDate = request.requestDate.toLocaleDateString('ro-RO');
            const eDate = request.endDate ? request.endDate.toLocaleDateString('ro-RO') : null;

            await prisma.notification.create({
                data: {
                    userId: request.userId,
                    companyId: request.companyId,
                    title: 'Cerere Ștearsă 🗑️',
                    message: `Cererea ta pentru ${sDate} a fost ștearsă de admin.`,
                    data: JSON.stringify({ type: 'TIME_OFF_DELETED' })
                }
            });

            if (request.user.pushNotifications && request.user.pushToken) {
                await sendTimeOffDeletedNotification(request.user.pushToken, sDate, eDate);
            }
        }

        console.log(`[DELETE /timeoff/${id}] Deleted by ${req.user.name}`);
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        console.error('[DELETE /timeoff/:id] Error:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

export default router;
