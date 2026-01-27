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
            {/* Animated Gradient Background - Blue/Cyan/Teal */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 animate-gradient-shift" />

            {/* Blurred Fleet Image Overlay */}
            <div
                className="absolute inset-0 opacity-15 bg-cover bg-center"
                style={{
                    backgroundImage: 'url(/login-bg.png)',
                    filter: 'blur(10px)',
                    backgroundPosition: 'center 40%'
                }}
            />

            {/* Floating Orbs - Blue/Cyan Theme */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-400/30 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-float-delayed" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-300/20 rounded-full blur-3xl animate-pulse" />

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-50">
                <LanguageSwitcher />
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 z-10 py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-w-md mx-auto"
                >
                    {/* Glassmorphism Card */}
                    <div className="relative">
                        {/* Glow Effect Behind Card */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-400 rounded-3xl blur-xl opacity-75 animate-pulse" />

                        {/* Main Glass Card */}
                        <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">

                            {/* Top Gradient Bar */}
                            <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-400" />

                            <div className="p-8">
                                {/* Large Neon Van Icon */}
                                <div className="text-center mb-6">
                                    <div className="inline-block relative">
                                        {/* Neon Glow Effect */}
                                        <div className="absolute inset-0 blur-2xl bg-cyan-400/50 rounded-full scale-110" />

                                        {/* Van SVG - Large & Clear */}
                                        <svg
                                            width="120"
                                            height="120"
                                            viewBox="0 0 120 120"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="relative drop-shadow-2xl"
                                        >
                                            <defs>
                                                <linearGradient id="neonVan" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#22d3ee" />
                                                    <stop offset="50%" stopColor="#3b82f6" />
                                                    <stop offset="100%" stopColor="#14b8a6" />
                                                </linearGradient>
                                                <filter id="glow">
                                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>

                                            {/* Van Body - Main Shape */}
                                            <rect x="20" y="45" width="80" height="35" rx="4"
                                                stroke="url(#neonVan)" strokeWidth="3" fill="none"
                                                filter="url(#glow)" className="animate-pulse-slow" />

                                            {/* Van Front/Cabin */}
                                            <path d="M20 55 L10 60 L10 75 L20 80 L20 55Z"
                                                stroke="#22d3ee" strokeWidth="3" fill="rgba(34, 211, 238, 0.1)"
                                                filter="url(#glow)" />

                                            {/* Windshield */}
                                            <rect x="24" y="50" width="16" height="20" rx="2"
                                                fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth="2" />

                                            {/* Cargo Area Windows */}
                                            <rect x="45" y="50" width="50" height="20" rx="2"
                                                fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" strokeWidth="2" />

                                            {/* Front Wheel */}
                                            <circle cx="35" cy="80" r="10"
                                                stroke="#22d3ee" strokeWidth="3" fill="rgba(34, 211, 238, 0.2)"
                                                filter="url(#glow)" />
                                            <circle cx="35" cy="80" r="5" fill="#22d3ee" />

                                            {/* Rear Wheel */}
                                            <circle cx="85" cy="80" r="10"
                                                stroke="#14b8a6" strokeWidth="3" fill="rgba(20, 184, 166, 0.2)"
                                                filter="url(#glow)" />
                                            <circle cx="85" cy="80" r="5" fill="#14b8a6" />

                                            {/* Headlight */}
                                            <circle cx="12" cy="67" r="3" fill="#fbbf24"
                                                className="animate-pulse" filter="url(#glow)" />

                                            {/* Side Detail Line */}
                                            <line x1="45" y1="60" x2="95" y2="60"
                                                stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />
                                        </svg>
                                    </div>

                                    {/* Brand Name */}
                                    <h1 className="text-4xl font-bold text-white mb-2 mt-4">
                                        MyFleet
                                    </h1>
                                    <p className="text-white/80 text-sm">
                                        Fleet Management System
                                    </p>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 text-white p-3 rounded-xl mb-6 text-sm"
                                    >
                                        <div className="flex items-center">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            {error}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Login Form */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Personal ID */}
                                    <div>
                                        <label className="block text-white/90 text-sm font-medium mb-2">
                                            {t('login.personalId')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={personalId}
                                                onChange={(e) => setPersonalId(e.target.value.toUpperCase())}
                                                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                                                placeholder="SA001"
                                                required
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-white/90 text-sm font-medium mb-2">
                                            {t('login.password')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                                            >
                                                {showPassword ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full py-3.5 rounded-xl font-semibold transition-all mt-6 ${loading
                                                ? 'bg-white/20 text-white/50 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/50'
                                            }`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Signing in...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center">
                                                {t('login.loginButton')}
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            </span>
                                        )}
                                    </motion.button>
                                </form>

                                {/* Footer */}
                                <div className="mt-6 text-center">
                                    <p className="text-white/60 text-xs">
                                        © 2026 MyFleet • Secure Login
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
