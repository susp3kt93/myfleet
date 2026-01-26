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

    const handleLogout = () => {
        dispatch(logout());
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modern Header with Gradient */}
            <header className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 shadow-2xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/admin/settings"
                                className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/30 hover:bg-white/35 transition-all duration-200 hover:scale-105 cursor-pointer overflow-hidden"
                            >
                                {companyLogo ? (
                                    <img
                                        src={companyLogo}
                                        alt="Company Logo"
                                        className="w-12 h-12 object-contain"
                                    />
                                ) : (
                                    <span className="text-4xl">🏢</span>
                                )}
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                                    {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Company Admin'}
                                </h1>
                                <p className="text-sm text-white/90 font-medium mt-1">
                                    {user?.name} {user?.companyId ? '• Company ID: ' + user.companyId.slice(0, 8) : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <LanguageSwitcher />
                            <button
                                onClick={handleLogout}
                                className="px-6 py-2.5 bg-white/25 hover:bg-white/35 backdrop-blur-md text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 border border-white/30"
                            >
                                {tCommon('navigation.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
