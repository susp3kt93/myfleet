'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { loadStoredAuth } from '../../../lib/authSlice';
import { startOfWeek, endOfWeek } from 'date-fns';
import WeekNavigator from '../../../components/WeekNavigator';
import { useTranslation } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';

export default function ReportsPage() {
    const { t } = useTranslation('admin');
    const { t: tCommon } = useTranslation('common');
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(loadStoredAuth());
    }, [dispatch]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user?.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'ADMIN') {
            loadWeeklyReport();
        }
    }, [currentDate, isAuthenticated, user]);

    const loadWeeklyReport = async () => {
        try {
            setLoading(true);
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

            const response = await api.get('/reports/weekly', {
                params: {
                    startDate: weekStart.toISOString().split('T')[0],
                    endDate: weekEnd.toISOString().split('T')[0]
                }
            });

            setReportData(response.data);
        } catch (error) {
            console.error('Error loading weekly report:', error);
            alert('Eroare la încărcarea raportului săptămânal');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated || user?.role !== 'ADMIN') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/admin" className="text-primary-500 hover:text-primary-600">
                                {tCommon('buttons.back')}
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Week Navigator */}
                <WeekNavigator
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                />

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="text-gray-600">{t('reports.loadingReport')}</div>
                    </div>
                )}

                {/* Report Table */}
                {!loading && reportData && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.driver')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.completed')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.accepted')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.pending')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.earnings')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('reports.rating')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.drivers.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {driver.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                                                    <div className="text-sm text-gray-500">{driver.personalId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                ✓ {driver.weeklyStats.completed}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                → {driver.weeklyStats.accepted}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                ⏳ {driver.weeklyStats.pending}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-green-600">
                                                {driver.weeklyStats.earnings.toFixed(2)} RON
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {driver.rating?.toFixed(1) || 'N/A'} ⭐
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {/* Totals Row */}
                                <tr className="bg-gray-100 font-bold">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                        {t('reports.total')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-green-800">✓ {reportData.totals.completed}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-blue-800">→ {reportData.totals.accepted}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-yellow-800">⏳ {reportData.totals.pending}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-green-600">{reportData.totals.earnings.toFixed(2)} RON</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        -
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
