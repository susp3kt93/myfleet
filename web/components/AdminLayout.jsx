'use client';

import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { logout } from '../lib/authSlice';
import { useTranslation } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Link from 'next/link';
import api from '../lib/api';

/**
 * AdminLayout - Reusable layout component for all admin pages
 * Features modern gradient header consistent across all admin pages
 */
export default function AdminLayout({ children }) {
    const { t: tCommon } = useTranslation('common');
    const router = useRouter();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [companyLogo, setCompanyLogo] = useState(null);

    // Fetch company logo
    useEffect(() => {
        const fetchCompanyLogo = async () => {
            if (user?.companyId) {
                try {
                    const res = await api.get(`/companies/${user.companyId}`);
                    if (res.data.logo) {
                        const logoUrl = res.data.logo;
                        setCompanyLogo(logoUrl.startsWith('http') ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002'}${logoUrl}`);
                    }
                } catch (error) {
                    console.error('Error fetching company logo:', error);
                }
            }
        };
        fetchCompanyLogo();
    }, [user?.companyId]);

    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    const handleLogout = () => {
        dispatch(logout());
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            {/* Background Image - Sprinter Van (Fixed) */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden h-full">
                {/* Sprinter Van Image - Fixed Bottom Right */}
                <div
                    className="absolute bottom-[-5%] right-[-5%] w-[85%] h-[85%] bg-no-repeat bg-contain bg-bottom opacity-20 mix-blend-multiply filter contrast-125 saturate-150"
                    style={{
                        backgroundImage: `url('/images/sprinter-bg.png')`,
                    }}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-white/90"></div>
            </div>

            {/* Modern Glassmorphism Header - Relative (Not Sticky) */}
            <header className="relative z-50 px-4 sm:px-6 lg:px-8 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-300 hover:shadow-xl">

                        {/* Left: Brand / Logo */}
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="flex items-center gap-3 decoration-0 group">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                                    {companyLogo ? (
                                        <img src={companyLogo} alt="Logo" className="w-8 h-8 object-contain" />
                                    ) : (
                                        <span className="text-xl">🏢</span>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                        MyFleet
                                    </h1>
                                    <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                                        {user?.role === 'SUPER_ADMIN' ? 'Platform' : 'Workspace'}
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Center: Navigation Buttons (Desktop) - Enhanced Size & Visibility */}
                        <nav className="hidden lg:flex items-center gap-3 mx-6">
                            <Link href="/admin/reports" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200/50 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
                                <span className="font-bold text-gray-800 text-sm tracking-wide">Weekly Reports</span>
                            </Link>

                            <Link href="/admin/activity" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/50 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                <span className="text-xl group-hover:scale-110 transition-transform">📆</span>
                                <span className="font-bold text-gray-800 text-sm tracking-wide">Activity</span>
                            </Link>

                            <Link href="/admin/timeoff" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border border-rose-200/50 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                <span className="text-xl group-hover:scale-110 transition-transform">🏖️</span>
                                <span className="font-bold text-gray-800 text-sm tracking-wide">Time Off</span>
                            </Link>

                            <Link href="/admin/settings" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/50 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                <span className="text-xl group-hover:scale-110 transition-transform">⚙️</span>
                                <span className="font-bold text-gray-800 text-sm tracking-wide">Settings</span>
                            </Link>
                        </nav>

                        {/* Right: Actions & Profile */}
                        <div className="flex items-center gap-4">
                            <LanguageSwitcher />

                            {/* Separator */}
                            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                            {/* Profile Dropdown Container */}
                            <div className="relative profile-menu-container">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 pl-1 pr-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-sm group-hover:shadow-md transition-shadow">
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                            {user?.photoUrl ? (
                                                <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-indigo-600">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Name (Desktop) */}
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                                            {user?.name?.split(' ')[0]}
                                        </p>
                                    </div>

                                    {/* Chevron */}
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 ring-1 ring-black/5 transform origin-top-right transition-all overflow-hidden z-50">
                                        {/* Header Info */}
                                        <div className="px-6 py-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100">
                                            <p className="text-sm text-gray-500 font-medium mb-1">Signed in as</p>
                                            <p className="text-gray-900 font-bold truncate">{user?.email}</p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user?.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                                                    user?.role === 'COMPANY_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {user?.role?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Company Info (if applies) */}
                                        {user?.companyId && (
                                            <div className="px-6 py-4 border-b border-gray-50">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-gray-50 rounded-lg">
                                                        <span className="text-lg">🏢</span>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Company ID</p>
                                                        <p className="text-xs font-mono bg-gray-100 text-gray-600 p-1.5 rounded border border-gray-200 break-all select-all">
                                                            {user.companyId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Links */}
                                        <div className="p-2">
                                            <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                                                <span className="text-lg">⚙️</span>
                                                Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                                            >
                                                <span className="text-lg">🚪</span>
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - No top padding needed as header is floating */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                {children}
            </main>
        </div>
    );
}
