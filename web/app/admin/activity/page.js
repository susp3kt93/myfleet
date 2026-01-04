'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { loadStoredAuth } from '../../../lib/authSlice';
import api from '../../../lib/api';
import { useTranslation } from '../../../contexts/LanguageContext';

export default function DriverActivityPage() {
    const { t, locale } = useTranslation('admin');
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [activityData, setActivityData] = useState(null);
    const [dateRange, setDateRange] = useState(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

        return {
            startDate: startOfWeek.toISOString().split('T')[0],
            endDate: endOfWeek.toISOString().split('T')[0]
        };
    });

    useEffect(() => {
        dispatch(loadStoredAuth());
    }, [dispatch]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user?.role !== 'COMPANY_ADMIN' && user?.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, user, router]);

    useEffect(() => {
        if (isAuthenticated && (user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN')) {
            fetchActivity();
        }
    }, [isAuthenticated, user, dateRange]);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reports/driver-activity', {
                params: dateRange
            });
            setActivityData(response.data);
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigateWeek = (direction) => {
        const start = new Date(dateRange.startDate);
        start.setDate(start.getDate() + (direction * 7));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-GB', { weekday: 'short', day: 'numeric' });
    };

    const getActivityCell = (activity) => {
        if (!activity) return <span className="text-gray-300">-</span>;

        switch (activity.type) {
            case 'WORKED':
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-green-600">
                            {activity.completedCount}/{activity.taskCount}
                        </span>
                        <span className="text-xs text-gray-500">£{activity.earnings}</span>
                    </div>
                );
            case 'OFF':
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-lg">🏖️</span>
                        <span className="text-xs text-orange-500">{t('activity.dayOff')}</span>
                    </div>
                );
            case 'IDLE':
                return <span className="text-gray-300">-</span>;
            default:
                return <span className="text-gray-300">-</span>;
        }
    };

    const getActivityBgColor = (activity) => {
        if (!activity) return '';
        switch (activity.type) {
            case 'WORKED':
                return activity.completedCount > 0 ? 'bg-green-50' : 'bg-yellow-50';
            case 'OFF':
                return 'bg-orange-50';
            default:
                return '';
        }
    };

    if (!isAuthenticated || (user?.role !== 'COMPANY_ADMIN' && user?.role !== 'SUPER_ADMIN')) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header with Green Gradient */}
            <header className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/admin" className="text-white/70 hover:text-white transition">
                                ← {t('activity.back')}
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white">📆 {t('activity.title')}</h1>
                                <p className="text-sm text-white/70">
                                    {t('activity.subtitle')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Week Navigator */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigateWeek(-1)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                            {t('activity.previousWeek')}
                        </button>
                        <div className="text-center">
                            <h2 className="text-lg font-semibold">
                                {new Date(dateRange.startDate).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-GB', {
                                    day: 'numeric',
                                    month: 'long'
                                })} - {new Date(dateRange.endDate).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </h2>
                        </div>
                        <button
                            onClick={() => navigateWeek(1)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                            {t('activity.nextWeek')}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {activityData && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600">{t('activity.activeDrivers')}</p>
                            <p className="text-2xl font-bold">{activityData.drivers?.length || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600">{t('activity.daysWorked')}</p>
                            <p className="text-2xl font-bold text-green-600">{activityData.totals?.daysWorked || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600">{t('activity.daysOff')}</p>
                            <p className="text-2xl font-bold text-orange-600">{activityData.totals?.daysOff || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600">{t('activity.tasksCompleted')}</p>
                            <p className="text-2xl font-bold text-blue-600">{activityData.totals?.completedTasks || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600">{t('activity.totalEarnings')}</p>
                            <p className="text-2xl font-bold text-purple-600">£{activityData.totals?.totalEarnings || 0}</p>
                        </div>
                    </div>
                )}

                {/* Activity Table */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">{t('activity.loading')}</p>
                    </div>
                ) : activityData ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                                            {t('activity.driver')}
                                        </th>
                                        {activityData.dates.map(date => (
                                            <th key={date} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                                                {formatDate(date)}
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activityData.drivers.map((driverData, idx) => (
                                        <tr key={driverData.driver.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-inherit">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-medium text-primary-600">
                                                            {driverData.driver.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {driverData.driver.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {driverData.driver.personalId}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            {activityData.dates.map(date => (
                                                <td
                                                    key={date}
                                                    className={`px-3 py-3 text-center ${getActivityBgColor(driverData.dailyActivity[date])}`}
                                                >
                                                    {getActivityCell(driverData.dailyActivity[date])}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-center bg-gray-100">
                                                <div className="text-sm">
                                                    <span className="font-bold text-green-600">{driverData.summary.daysWorked}</span> {t('activity.days')}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    £{driverData.summary.totalEarnings}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">{t('activity.noData')}</p>
                    </div>
                )}

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
                        <span>{t('activity.worked')}</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-orange-50 border border-orange-200 rounded mr-2"></div>
                        <span>🏖️ {t('activity.dayOff')}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-300 mr-2">-</span>
                        <span>{t('activity.noActivity')}</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
