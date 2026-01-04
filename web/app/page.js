'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../lib/authSlice';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
    const { t } = useTranslation('auth');
    const [personalId, setPersonalId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(login({ personalId, password }));
        if (!result.error) {
            const userRole = result.payload.user.role;
            if (userRole === 'SUPER_ADMIN') {
                router.push('/super-admin');
            } else if (userRole === 'COMPANY_ADMIN' || userRole === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: "url('/login-bg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-emerald-800/80 to-green-700/70 backdrop-blur-[2px]"></div>
            </div>

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-20">
                <LanguageSwitcher />
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 mx-4 border border-white/20"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-block p-4 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 mb-4"
                    >
                        <span className="text-5xl">🚛</span>
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('login.title')}</h1>
                    <p className="text-gray-600">{t('login.subtitle')}</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm flex items-center"
                    >
                        <span className="mr-2">⚠️</span>
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('login.personalId')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={personalId}
                                onChange={(e) => setPersonalId(e.target.value.toUpperCase())}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                placeholder="e.g., DRV-001"
                                required
                            />
                            <span className="absolute right-3 top-3 text-gray-400">👤</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('login.password')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition focus:outline-none"
                            >
                                {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold shadow-lg transition-all ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            t('login.loginButton')
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-center text-xs text-gray-500">
                        {t('login.demoAccounts')}:
                        <br />
                        <span className="font-mono bg-gray-100 px-1 rounded">DRV-001</span> / <span className="font-mono bg-gray-100 px-1 rounded">driver123</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
