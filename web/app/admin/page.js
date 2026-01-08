'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { logout, loadStoredAuth } from '../../lib/authSlice';
import { fetchTasks } from '../../lib/tasksSlice';
import { fetchUsers } from '../../lib/usersSlice';
import { useTranslation } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function AdminPage() {
    const { t } = useTranslation('admin');
    const { t: tCommon } = useTranslation('common');
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { tasks } = useSelector((state) => state.tasks);
    const { users } = useSelector((state) => state.users);
    const [pendingTimeOffCount, setPendingTimeOffCount] = useState(0);
    const [showTimeOffBadge, setShowTimeOffBadge] = useState(false);

    useEffect(() => {
        dispatch(loadStoredAuth());
    }, [dispatch]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user?.role !== 'ADMIN' && user?.role !== 'COMPANY_ADMIN') {
            router.push('/dashboard');
        } else {
            dispatch(fetchTasks());
            dispatch(fetchUsers());
            fetchTimeOffCount();
        }
    }, [isAuthenticated, user]);

    const fetchTimeOffCount = async () => {
        try {
            const response = await api.get('/timeoff/pending-count');
            const count = response.data.count;
            setPendingTimeOffCount(count);

            // Always show badge if there are pending requests
            setShowTimeOffBadge(count > 0);
        } catch (error) {
            console.error('Error fetching time off count:', error);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        router.push('/');
    };

    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'COMPANY_ADMIN')) {
        return null;
    }

    const stats = {
        totalDrivers: users.filter(u => u.role === 'DRIVER').length,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header with Green Gradient */}
            <header className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <span className="text-3xl">👨‍💼</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Company Admin'}</h1>
                                <p className="text-sm text-white/70">{user.name} {user.companyId ? '| Company ID: ' + user.companyId.slice(0, 8) : ''}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <LanguageSwitcher />
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-lg transition font-medium"
                            >
                                {tCommon('navigation.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link href="/admin/users" className="block transform hover:scale-105 transition-transform duration-200">
                        <div className="bg-white rounded-2xl shadow-lg p-6 h-full border-l-4 border-blue-500 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{t('dashboard.stats.totalDrivers')}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDrivers}</p>
                                </div>
                                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl">👥</div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/tasks" className="block transform hover:scale-105 transition-transform duration-200">
                        <div className="bg-white rounded-2xl shadow-lg p-6 h-full border-l-4 border-purple-500 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{t('dashboard.stats.totalTasks')}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTasks}</p>
                                </div>
                                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-3xl">📋</div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/tasks?status=PENDING" className="block transform hover:scale-105 transition-transform duration-200">
                        <div className="bg-white rounded-2xl shadow-lg p-6 h-full border-l-4 border-amber-500 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{t('dashboard.stats.pendingTasks')}</p>
                                    <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingTasks}</p>
                                </div>
                                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center text-3xl">⏳</div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/tasks?status=COMPLETED" className="block transform hover:scale-105 transition-transform duration-200">
                        <div className="bg-white rounded-2xl shadow-lg p-6 h-full border-l-4 border-green-500 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{t('dashboard.stats.completed')}</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.completedTasks}</p>
                                </div>
                                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">✅</div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/admin/users" className="block group">
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-blue-500 group-hover:scale-[1.02]">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-4xl group-hover:bg-blue-200 transition">👥</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{t('dashboard.actions.manageUsers')}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{t('dashboard.actions.manageUsersDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/tasks" className="block group">
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-purple-500 group-hover:scale-[1.02]">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center text-4xl group-hover:bg-purple-200 transition">📋</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{t('dashboard.actions.manageTasks')}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{t('dashboard.actions.manageTasksDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/reports" className="block group">
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-amber-500 group-hover:scale-[1.02]">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center text-4xl group-hover:bg-amber-200 transition">📊</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{t('dashboard.actions.weeklyReports')}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{t('dashboard.actions.weeklyReportsDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/activity" className="block group">
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-green-500 group-hover:scale-[1.02]">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center text-4xl group-hover:bg-green-200 transition">📆</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{t('dashboard.actions.driverActivity')}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{t('dashboard.actions.driverActivityDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/timeoff" className="block group relative">
                        {showTimeOffBadge && (
                            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-pulse z-10">
                                {pendingTimeOffCount}
                            </div>
                        )}
                        <div className={`rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer group-hover:scale-[1.02] ${pendingTimeOffCount > 0
                                ? 'bg-gradient-to-br from-orange-50 to-red-50 border-l-4 border-red-500 animate-pulse ring-2 ring-red-400 ring-opacity-50'
                                : 'bg-white border-l-4 border-orange-500'
                            }`}>
                            <div className="flex items-center space-x-4">
                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl transition ${pendingTimeOffCount > 0 ? 'bg-white shadow-sm' : 'bg-orange-100 group-hover:bg-orange-200'
                                    }`}>🏖️</div>
                                <div>
                                    <h3 className={`text-xl font-bold ${pendingTimeOffCount > 0 ? 'text-red-800' : 'text-gray-900'}`}>{t('dashboard.actions.timeOffRequests')}</h3>
                                    <p className={`text-sm mt-1 ${pendingTimeOffCount > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                        {pendingTimeOffCount > 0
                                            ? <span className="flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-ping" />
                                                {pendingTimeOffCount} {t('timeoff.pending')}
                                            </span>
                                            : t('dashboard.actions.timeOffRequestsDesc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>


                    <Link href="/admin/vehicles" className="block group">
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-cyan-500 group-hover:scale-[1.02]">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center text-4xl group-hover:bg-cyan-200 transition">🚗</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{t('dashboard.actions.fleetVehicles') || 'Fleet Vehicles'}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{t('dashboard.actions.fleetVehiclesDesc') || 'Manage vehicles, mileage, and service'}</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* NEW: Settings Card */}
                    <Link href="/admin/settings" className="block group">
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-gray-500 group-hover:scale-[1.02]">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-4xl group-hover:bg-gray-200 transition">⚙️</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Company Settings</h3>
                                    <p className="text-gray-500 text-sm mt-1">Manage branding and company details</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
