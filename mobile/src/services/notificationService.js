import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
    if (!Device.isDevice) {
        console.log('[Notifications] Must use physical device for Push Notifications');
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('[Notifications] Failed to get push token for push notification!');
        return false;
    }

    return true;
}

/**
 * Get Expo Push Token
 */
export async function getExpoPushToken() {
    try {
        const token = await Notifications.getExpoPushTokenAsync();
        console.log('[Notifications] Expo Push Token:', token.data);
        return token.data;
    } catch (error) {
        console.error('[Notifications] Error getting push token:', error);
        return null;
    }
}

/**
 * Register push token with backend
 */
export async function registerPushToken() {
    try {
        // Request permissions first
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            return null;
        }

        // Get the token
        const pushToken = await getExpoPushToken();
        if (!pushToken) {
            return null;
        }

        // Save token locally
        await AsyncStorage.setItem('pushToken', pushToken);

        // Send token to backend (uses new /push-token endpoint)
        const response = await API.post('/push-token', {
            token: pushToken
        });

        console.log('[Notifications] Token registered with backend:', response.data);
        return pushToken;

    } catch (error) {
        console.error('[Notifications] Error registering push token:', error);
        return null;
    }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
    // Listener for notifications received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('[Notifications] Notification received:', notification);
        if (onNotificationReceived) {
            onNotificationReceived(notification);
        }
    });

    // Listener for user tapping on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('[Notifications] Notification tapped:', response);
        const data = response.notification.request.content.data;

        if (onNotificationTapped) {
            onNotificationTapped(data);
        }
    });

    // Return cleanup function
    return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
    };
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(title, body, data = {}, seconds = 2) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            data: data,
            sound: true,
        },
        trigger: { seconds },
    });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification preferences from backend
 */
export async function getNotificationPreferences() {
    try {
        const response = await API.get('/notifications/preferences');
        return response.data.preferences;
    } catch (error) {
        console.error('[Notifications] Error getting preferences:', error);
        return null;
    }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(emailNotifications, pushNotifications) {
    try {
        const response = await API.put('/notifications/preferences', {
            emailNotifications,
            pushNotifications,
        });
        return response.data.preferences;
    } catch (error) {
        console.error('[Notifications] Error updating preferences:', error);
        return null;
    }
}
