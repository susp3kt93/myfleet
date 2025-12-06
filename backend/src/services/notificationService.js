import { Expo } from 'expo-server-sdk';
import { createTransport } from 'nodemailer';
import prisma from '../utils/prisma.js';

// Initialize Expo SDK
const expo = new Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN,
    useFcmV1: true
});

// Initialize email transporter
const emailTransporter = createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Verify email configuration
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    emailTransporter.verify((error, success) => {
        if (error) {
            console.log('[Email Service] Configuration error:', error.message);
        } else {
            console.log('[Email Service] Ready to send emails');
        }
    });
}

/**
 * Send push notification to a single user
 * @param {String} pushToken - User's Expo push token
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @returns {Promise}
 */
export async function sendPushNotification(pushToken, title, body, data = {}) {
    if (!pushToken) {
        console.warn('[NotificationService] No push token provided');
        return null;
    }

    // Check if the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`[NotificationService] Invalid Expo push token: ${pushToken}`);
        return null;
    }

    const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
        channelId: 'default',
    };

    try {
        const ticketChunk = await expo.sendPushNotificationsAsync([message]);
        console.log('[NotificationService] Notification sent:', ticketChunk);
        return ticketChunk[0];
    } catch (error) {
        console.error('[NotificationService] Error sending notification:', error);
        throw error;
    }
}

/**
 * Send push notifications to multiple users
 * @param {Array} pushTokens - Array of Expo push tokens
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Additional data
 * @returns {Promise}
 */
export async function sendBulkNotifications(pushTokens, title, body, data = {}) {
    const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
        console.warn('[NotificationService] No valid push tokens');
        return [];
    }

    const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
        channelId: 'default',
    }));

    try {
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log(`[NotificationService] Sent ${tickets.length} notifications`);
        return tickets;
    } catch (error) {
        console.error('[NotificationService] Error sending bulk notifications:', error);
        throw error;
    }
}

/**
 * Notify driver of newly assigned task
 * @param {Object} task - Task object
 * @param {Object} driver - Driver user object
 * @returns {Promise}
 */
export async function notifyTaskAssigned(task, driver) {
    if (!driver.pushToken || !driver.notificationsEnabled) {
        return null;
    }

    const date = new Date(task.scheduledDate).toLocaleDateString('ro-RO');
    const title = '🚗 Task Nou Alocat';
    const body = `${task.title} - ${date} (${task.price} RON)`;
    const data = {
        type: 'TASK_ASSIGNED',
        taskId: task.id,
        screen: 'TaskDetails',
    };

    return sendPushNotification(driver.pushToken, title, body, data);
}

/**
 * Send 24-hour reminder for upcoming task
 * @param {Object} task - Task object
 * @param {Object} driver - Driver user object
 * @returns {Promise}
 */
export async function notifyTaskReminder(task, driver) {
    if (!driver.pushToken || !driver.notificationsEnabled) {
        return null;
    }

    const date = new Date(task.scheduledDate).toLocaleDateString('ro-RO');
    const title = '⏰ Reminder: Task Mâine';
    const body = `Nu uita: ${task.title} - ${date}`;
    const data = {
        type: 'TASK_REMINDER',
        taskId: task.id,
        screen: 'TaskDetails',
    };

    return sendPushNotification(driver.pushToken, title, body, data);
}

/**
 * Notify admin of task status change
 * @param {Object} task - Task object
 * @param {String} status - New status
 * @param {Object} admin - Admin user object
 * @returns {Promise}
 */
export async function notifyTaskStatusChange(task, status, admin) {
    if (!admin.pushToken || !admin.notificationsEnabled) {
        return null;
    }

    let title = '';
    let emoji = '';

    switch (status) {
        case 'ACCEPTED':
            title = 'Task Acceptat';
            emoji = '✅';
            break;
        case 'REJECTED':
            title = 'Task Respins';
            emoji = '❌';
            break;
        case 'COMPLETED':
            title = 'Task Completat';
            emoji = '🎉';
            break;
        case 'CANCELLED':
            title = 'Task Anulat';
            emoji = '🚫';
            break;
        default:
            title = 'Task Update';
            emoji = '📋';
    }

    const body = `${emoji} ${task.title} - ${task.assignedTo?.name || 'Șofer'}`;
    const data = {
        type: 'TASK_STATUS_CHANGE',
        taskId: task.id,
        status: status,
    };

    return sendPushNotification(admin.pushToken, title, body, data);
}

/**
 * Send broadcast notification to all drivers
 * @param {Array} drivers - Array of driver objects
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @returns {Promise}
 */
export async function notifyBroadcast(drivers, title, message) {
    const pushTokens = drivers
        .filter(d => d.pushToken && d.notificationsEnabled)
        .map(d => d.pushToken);

    if (pushTokens.length === 0) {
        return [];
    }

    return sendBulkNotifications(pushTokens, title, message, {
        type: 'BROADCAST',
    });
}
/**
 * Send email notification
 */
export async function sendEmail(userId, subject, htmlContent, textContent = '') {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, emailNotifications: true, name: true }
        });

        if (!user || !user.emailNotifications || !user.email) {
            console.log(`[Email] Skipping for user ${userId} - no email or disabled`);
            return { success: false, reason: 'no_email_or_disabled' };
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"MyFleet" <noreply@myfleet.com>',
            to: user.email,
            subject: subject,
            text: textContent || subject,
            html: htmlContent,
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`[Email] Sent to ${user.name} (${user.email}): ${subject}`);

        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('[Email] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Save notification to database
 */
export async function saveNotification(userId, title, message, data = null) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                data: data ? JSON.stringify(data) : null,
            }
        });
        return notification;
    } catch (error) {
        console.error('[Notification DB] Error saving:', error);
        return null;
    }
}

/**
 * Send complete notification (push + email + save to DB)
 */
export async function sendCompleteNotification(userId, title, body, emailSubject, emailHtml, data = {}) {
    // Save to database
    await saveNotification(userId, title, body, data);

    // Get user with tokens
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true, pushNotifications: true, email: true, emailNotifications: true }
    });

    const results = {};

    // Send push notification
    if (user?.pushToken && user.pushNotifications) {
        try {
            results.push = await sendPushNotification(user.pushToken, title, body, data);
        } catch (error) {
            console.error('[Complete Notification] Push error:', error);
            results.push = null;
        }
    }

    // Send email
    if (user?.email && user.emailNotifications) {
        try {
            results.email = await sendEmail(userId, emailSubject || title, emailHtml || `<p>${body}</p>`);
        } catch (error) {
            console.error('[Complete Notification] Email error:', error);
            results.email = null;
        }
    }

    return results;
}
