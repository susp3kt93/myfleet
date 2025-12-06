// Rating calculation utilities
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Calculate rating bonus/penalty based on completion time
 * @param {Date} scheduledDate - When task was scheduled
 * @param {Date} completionDate - When task was actually completed
 * @returns {number} Rating change (+0.15 early, +0.1 on time, -0.2 late)
 */
export function calculateCompletionBonus(scheduledDate, completionDate) {
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(0, 0, 0, 0);

    const completed = new Date(completionDate);
    completed.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((completed - scheduled) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
        // Completed before scheduled date (early)
        return 0.15;
    } else if (daysDiff === 0) {
        // Completed on scheduled date (on time)
        return 0.1;
    } else {
        // Completed after scheduled date (late)
        return -0.2;
    }
}

/**
 * Check if driver has completed 10 tasks in a row without issues
 * @param {string} driverId - Driver's user ID
 * @returns {Promise<boolean>} True if driver has 10 task streak
 */
export async function checkStreakBonus(driverId) {
    const recentTasks = await prisma.task.findMany({
        where: {
            assignedToId: driverId,
            status: { in: ['COMPLETED', 'REJECTED', 'CANCELLED'] }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
    });

    // Check if last 10 tasks are all COMPLETED
    if (recentTasks.length < 10) return false;

    return recentTasks.every(task => task.status === 'COMPLETED');
}

/**
 * Apply rating change with safety limits
 * @param {string} userId - User ID
 * @param {number} change - Rating change amount (can be positive or negative)
 * @param {string} reason - Reason for rating change
 * @returns {Promise<Object>} Updated user with new rating
 */
export async function applyRatingChange(userId, change, reason = '') {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { rating: true }
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Calculate new rating with limits
    let newRating = (user.rating || 3.0) + change;

    // Apply limits: min 1.0, max 5.0
    newRating = Math.max(1.0, Math.min(5.0, newRating));

    // Round to 2 decimal places
    newRating = Math.round(newRating * 100) / 100;

    console.log(`[Rating] User ${userId}: ${user.rating} → ${newRating} (${change > 0 ? '+' : ''}${change}) - ${reason}`);

    // Update user rating
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { rating: newRating },
        select: {
            id: true,
            personalId: true,
            name: true,
            rating: true
        }
    });

    return updatedUser;
}

/**
 * Get rating display info
 * @param {number} rating - Rating value (1.0 - 5.0)
 * @returns {Object} Display information (stars, color, trend)
 */
export function getRatingDisplay(rating) {
    const stars = '⭐️'.repeat(Math.round(rating));
    let color = 'yellow';

    if (rating >= 4.0) {
        color = 'green';
    } else if (rating < 3.0) {
        color = 'red';
    }

    return {
        stars,
        color,
        value: rating.toFixed(1)
    };
}
