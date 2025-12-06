'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
    const { locale, changeLanguage } = useLanguage();
    const [showDropdown, setShowDropdown] = useState(false);

    const languages = [
        { code: 'en', flag: '🇬🇧', name: 'English' },
        { code: 'ro', flag: '🇷🇴', name: 'Română' }
    ];

    const getCurrentLanguage = () => languages.find(l => l.code === locale) || languages[1];

    const handleLanguageChange = (newLocale) => {
        changeLanguage(newLocale);
        setShowDropdown(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
                <span className="text-xl">{getCurrentLanguage().flag}</span>
                <span className="text-sm font-medium text-gray-700">{getCurrentLanguage().code.toUpperCase()}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    ></div>

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition first:rounded-t-lg last:rounded-b-lg ${locale === lang.code ? 'bg-primary-50' : ''
                                    }`}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="text-sm font-medium text-gray-700">{lang.name}</span>
                                {locale === lang.code && (
                                    <span className="ml-auto text-primary-600">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
