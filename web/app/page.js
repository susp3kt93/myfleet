'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../lib/authSlice';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ParticleBackground from '../components/ParticleBackground';
import SprinterWireframe from '../components/SprinterWireframe';

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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
            {/* Particle Network Background */}
            <div className="absolute inset-0 z-0">
                <ParticleBackground />
            </div>

            {/* Ambient Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-50">
                <LanguageSwitcher />
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-4 z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">

                {/* Visual Side (Wireframe Van) - Hidden on mobile, visible on lg */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1 }}
                    className="hidden lg:block w-full max-w-xl relative"
                >
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-3xl blur-2xl"></div>
                    <SprinterWireframe className="relative z-10 opacity-90 drop-shadow-2xl" />
                    <div className="text-center mt-8">
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-tight">
                            MYFLEET <span className="text-white/50 font-light text-2xl ml-2">v2.0</span>
                        </h2>
                        <p className="text-slate-400 mt-2 font-mono text-sm tracking-widest uppercase">
                            Next Gen Logistics Operations
                        </p>
                    </div>
                </motion.div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                    className="w-full max-w-md relative"
                >
                    {/* Glassmorphism Card */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative overflow-hidden">

                        {/* Shimmer Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

                        <div className="text-center mb-8 lg:hidden">
                            {/* Mobile Header */}
                            <h1 className="text-3xl font-bold text-white mb-2">MyFleet</h1>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">{t('login.title')}</h2>
                            <p className="text-slate-400 text-sm">{t('login.subtitle')}</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg mb-6 text-sm flex items-center"
                            >
                                <span className="mr-2">⚠️</span>
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="group">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-purple-400 transition-colors">
                                    {t('login.personalId')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={personalId}
                                        onChange={(e) => setPersonalId(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono"
                                        placeholder="DRV-001"
                                        required
                                    />
                                    <span className="absolute right-4 top-3.5 text-slate-500">👤</span>
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-cyan-400 transition-colors">
                                    {t('login.password')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition focus:outline-none"
                                    >
                                        {showPassword ? "👁️" : "👁️‍🗨️"}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 px-4 rounded-xl text-white font-bold tracking-wide shadow-lg transition-all mt-4 ${loading
                                    ? 'bg-slate-700 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 relative overflow-hidden'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                                <span className="relative z-10 flex items-center justify-center">
                                    {loading ? 'Initializing...' : t('login.loginButton')}
                                    {!loading && <span className="ml-2">→</span>}
                                </span>
                            </motion.button>
                        </form>
                    </div>

                    <p className="text-center text-slate-500 text-xs mt-6">
                        &copy; 2026 MyFleet Logistics. Secure System.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

