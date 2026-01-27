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
            {/* Glassmorphism Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 transition-all shadow-lg hover:shadow-cyan-500/20"
            >
                <span className="text-xl">{getCurrentLanguage().flag}</span>
                <span className="text-sm font-semibold text-white">{getCurrentLanguage().code.toUpperCase()}</span>
                <svg
                    className={`w-4 h-4 text-white/80 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
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

                    {/* Glassmorphism Dropdown */}
                    <div className="absolute right-0 mt-3 w-48 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl z-[110] overflow-hidden">
                        {/* Gradient Top Border */}
                        <div className="h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-400" />

                        {languages.map((lang, index) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/20 transition-all ${locale === lang.code ? 'bg-white/10' : ''
                                    } ${index === 0 ? 'pt-4' : ''} ${index === languages.length - 1 ? 'pb-4' : ''}`}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="text-sm font-medium text-white">{lang.name}</span>
                                {locale === lang.code && (
                                    <span className="ml-auto">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3">
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
