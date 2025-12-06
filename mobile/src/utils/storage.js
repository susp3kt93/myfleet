import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cross-platform storage utility
 * Uses SecureStore on mobile and localStorage on web
 */
const storage = {
    async setItemAsync(key, value) {
        if (Platform.OS === 'web') {
            try {
                localStorage.setItem(key, value);
            } catch (error) {
                console.error('[Storage] Error setting item:', error);
                throw error;
            }
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },

    async getItemAsync(key) {
        if (Platform.OS === 'web') {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                console.error('[Storage] Error getting item:', error);
                return null;
            }
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },

    async deleteItemAsync(key) {
        if (Platform.OS === 'web') {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('[Storage] Error deleting item:', error);
            }
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    },
};

export default storage;
