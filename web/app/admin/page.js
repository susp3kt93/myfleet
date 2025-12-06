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

    useEffect(() => {
        dispatch(loadStoredAuth());
    }, [dispatch]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user?.role !== 'ADMIN') {
            router.push('/dashboard');
        } else {
            dispatch(fetchTasks());
            dispatch(fetchUsers());
        }
    }, [isAuthenticated, user]);

    const handleLogout = () => {
        dispatch(logout());
        router.push('/');
    };

    if (!isAuthenticated || user?.role !== 'ADMIN') {
        return null;
    }

    const stats = {
        totalDrivers: users.filter(u => u.role === 'DRIVER').length,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                                <span className="text-2xl">👨‍💼</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                                <p className="text-sm text-gray-600">{user.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <LanguageSwitcher />
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
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
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{t('dashboard.stats.totalDrivers')}</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalDrivers}</p>
                            </div>
                            <div className="text-4xl">👥</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{t('dashboard.stats.totalTasks')}</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                            </div>
                            <div className="text-4xl">📋</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{t('dashboard.stats.pendingTasks')}</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.pendingTasks}</p>
                            </div>
                            <div className="text-4xl">⏳</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{t('dashboard.stats.completed')}</p>
                                <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
                            </div>
                            <div className="text-4xl">✅</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/admin/users" className="block">
                        <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-primary-500">
                            <div className="flex items-center space-x-4">
                                <div className="text-5xl">👥</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{t('dashboard.actions.manageUsers')}</h3>
                                    <p className="text-gray-600">{t('dashboard.actions.manageUsersDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/tasks" className="block">
                        <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-primary-500">
                            <div className="flex items-center space-x-4">
                                <div className="text-5xl">📋</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{t('dashboard.actions.manageTasks')}</h3>
                                    <p className="text-gray-600">{t('dashboard.actions.manageTasksDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/reports" className="block">
                        <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-primary-500">
                            <div className="flex items-center space-x-4">
                                <div className="text-5xl">📊</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{t('dashboard.actions.weeklyReports')}</h3>
                                    <p className="text-gray-600">{t('dashboard.actions.weeklyReportsDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
