import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ro from './locales/ro.json';
import en from './locales/en.json';

const LANGUAGE_KEY = '@myfleet_language';

// Get saved language or default to Romanian
const getStoredLanguage = async () => {
    try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        return savedLanguage || 'ro';
    } catch (error) {
        console.error('Error loading language preference:', error);
        return 'ro';
    }
};

i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        resources: {
            ro: { translation: ro },
            en: { translation: en }
        },
        lng: 'ro', // Will be updated after AsyncStorage loads
        fallbackLng: 'ro',
        interpolation: {
            escapeValue: false
        }
    });

// Load saved language preference
getStoredLanguage().then(language => {
    i18n.changeLanguage(language);
});

// Save language preference when changed
i18n.on('languageChanged', async (lng) => {
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
        console.error('Error saving language preference:', error);
    }
});

export default i18n;
