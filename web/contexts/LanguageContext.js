'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Import all translations
import commonEn from '../public/locales/en/common.json';
import commonRo from '../public/locales/ro/common.json';
import authEn from '../public/locales/en/auth.json';
import authRo from '../public/locales/ro/auth.json';
import dashboardEn from '../public/locales/en/dashboard.json';
import dashboardRo from '../public/locales/ro/dashboard.json';
import adminEn from '../public/locales/en/admin.json';
import adminRo from '../public/locales/ro/admin.json';

const translations = {
    en: {
        common: commonEn,
        auth: authEn,
        dashboard: dashboardEn,
        admin: adminEn,
    },
    ro: {
        common: commonRo,
        auth: authRo,
        dashboard: dashboardRo,
        admin: adminRo,
    },
};

export function LanguageProvider({ children }) {
    const [locale, setLocale] = useState('ro');  // Default Romanian

    useEffect(() => {
        // Load saved language preference
        const saved = localStorage.getItem('language');
        if (saved && (saved === 'en' || saved === 'ro')) {
            setLocale(saved);
        }
    }, []);

    const changeLanguage = (newLocale) => {
        setLocale(newLocale);
        localStorage.setItem('language', newLocale);
    };

    const value = {
        locale,
        changeLanguage,
        t: (namespace, key) => {
            const keys = key.split('.');
            let value = translations[locale][namespace];

            for (const k of keys) {
                value = value?.[k];
            }

            return value || key;
        },
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation(namespace = 'common') {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error('useTranslation must be used within LanguageProvider');
    }

    return {
        t: (key) => context.t(namespace, key),
        locale: context.locale,
        changeLanguage: context.changeLanguage,
    };
}

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }

    return {
        locale: context.locale,
        changeLanguage: context.changeLanguage,
    };
}
