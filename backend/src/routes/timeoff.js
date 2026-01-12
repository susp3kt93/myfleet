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

// ... (existing code matches until DELETE) ...

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
