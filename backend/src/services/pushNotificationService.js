// Push Notification Service using Expo Push Notifications
import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send a push notification to a single device
 * @param {string} pushToken - The Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with the notification
 */
export const sendPushNotification = async (pushToken, title, body, data = {}) => {
    try {
        // Check that the push token is valid
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`[Push] Invalid Expo push token: ${pushToken}`);
            return { success: false, error: 'Invalid push token' };
        }

        // Construct the message
        const message = {
            to: pushToken,
            sound: 'default',
            title,
            body,
            data,
            badge: 1,
            priority: 'high',
        };

        // Send the notification
        const chunks = expo.chunkPushNotifications([message]);
        const tickets = [];

        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log(`[Push] Sent notification to ${pushToken}: ${title}`);
        return { success: true, tickets };
    } catch (error) {
        console.error('[Push] Error sending notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send push notifications to multiple devices
 * @param {Array} pushTokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with the notification
 */
export const sendPushNotificationToMany = async (pushTokens, title, body, data = {}) => {
    try {
        // Filter valid tokens
        const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token));

        if (validTokens.length === 0) {
            console.log('[Push] No valid push tokens to send to');
            return { success: false, error: 'No valid tokens' };
        }

        // Construct the messages
        const messages = validTokens.map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data,
            badge: 1,
            priority: 'high',
        }));

        // Chunk and send
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log(`[Push] Sent ${tickets.length} notifications`);
        return { success: true, tickets };
    } catch (error) {
        console.error('[Push] Error sending notifications:', error);
        return { success: false, error: error.message };
    }
};

// Specific notification functions
export const sendTaskAssignedNotification = async (pushToken, taskTitle, taskDate) => {
    return sendPushNotification(
        pushToken,
        '🚛 New Task Assigned',
        `${taskTitle} - ${taskDate}`,
        { type: 'TASK_ASSIGNED', screen: 'Tasks' }
    );
};

export const sendTimeOffApprovedNotification = async (pushToken, startDate, endDate) => {
    const period = endDate ? `${startDate} → ${endDate}` : startDate;
    return sendPushNotification(
        pushToken,
        '✅ Time Off Approved',
        `Your request for ${period} has been approved!`,
        { type: 'TIMEOFF_APPROVED', screen: 'TimeOff' }
    );
};

export const sendTimeOffRejectedNotification = async (pushToken, startDate, endDate) => {
    const period = endDate ? `${startDate} → ${endDate}` : startDate;
    return sendPushNotification(
        pushToken,
        '❌ Time Off Rejected',
        `Your request for ${period} has been rejected.`,
        { type: 'TIMEOFF_REJECTED', screen: 'TimeOff' }
    );
};

export const sendTaskStatusChangedNotification = async (pushToken, taskTitle, newStatus) => {
    const statusEmoji = {
        'COMPLETED': '✅',
        'CANCELLED': '🚫',
        'ACCEPTED': '👍',
        'PENDING': '⏳'
    };
    return sendPushNotification(
        pushToken,
        `${statusEmoji[newStatus] || '📋'} Task Updated`,
        `${taskTitle} is now ${newStatus}`,
        { type: 'TASK_STATUS_CHANGED', screen: 'Tasks' }
    );
};

export const sendTimeOffUpdatedNotification = async (pushToken, startDate, endDate) => {
    const period = endDate ? `${startDate} → ${endDate}` : startDate;
    return sendPushNotification(
        pushToken,
        '✏️ Time Off Updated',
        `Your request for ${period} has been updated by admin.`,
        { type: 'TIMEOFF_UPDATED', screen: 'TimeOff' }
    );
};

export const sendTimeOffDeletedNotification = async (pushToken, startDate, endDate) => {
    const period = endDate ? `${startDate} → ${endDate}` : startDate;
    return sendPushNotification(
        pushToken,
        '🗑️ Time Off Deleted',
        `Your request for ${period} has been deleted by admin.`,
        { type: 'TIMEOFF_DELETED', screen: 'TimeOff' }
    );
};

export default {
    sendPushNotification,
    sendPushNotificationToMany,
    sendTaskAssignedNotification,
    sendTimeOffApprovedNotification,
    sendTimeOffRejectedNotification,
    sendTaskStatusChangedNotification,
    sendTimeOffUpdatedNotification,
    sendTimeOffDeletedNotification
};
