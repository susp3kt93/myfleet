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
            {/* Glassmorphism Button (Light Mode Optimized) */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/50 backdrop-blur-xl border border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-sm hover:shadow-md group"
            >
                <span className="text-xl filter drop-shadow-sm">{getCurrentLanguage().flag}</span>
                <span className="text-sm font-bold text-gray-700 group-hover:text-black">{getCurrentLanguage().code.toUpperCase()}</span>
                <svg
                    className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setShowDropdown(false)}
                    ></div>

                    {/* Glassmorphism Dropdown (Light Mode) */}
                    <div className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-xl shadow-2xl z-[110] overflow-hidden">
                        {/* Gradient Top Border */}
                        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        {languages.map((lang, index) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-all ${locale === lang.code ? 'bg-indigo-50/50' : ''
                                    } ${index === 0 ? 'pt-4' : ''} ${index === languages.length - 1 ? 'pb-4' : ''}`}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="text-sm font-medium text-gray-700">{lang.name}</span>
                                {locale === lang.code && (
                                    <span className="ml-auto">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-indigo-600" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
