import prisma from '../lib/prisma.js';

/**
 * Log a user activity
 * @param {string} companyId - The ID of the company
 * @param {string} userId - The ID of the user performing the action
 * @param {string} action - The action type (e.g., 'TASK_CREATED')
 * @param {string} details - Human-readable details
 * @param {object} metadata - Optional metadata object (will be JSON stringified)
 */
export const logActivity = async (companyId, userId, action, details, metadata = null) => {
    try {
        await prisma.activityLog.create({
            data: {
                companyId,
                userId,
                action,
                details,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });
        console.log(`[ActivityLog] ${action}: ${details}`);
    } catch (error) {
        console.error('[ActivityLog] Failed to create log:', error);
        // Don't throw, just log the error so main flow isn't interrupted
    }
};
