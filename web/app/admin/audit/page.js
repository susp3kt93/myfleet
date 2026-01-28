'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../lib/api';
import { format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useTranslation } from '../../../contexts/LanguageContext';

export default function AuditPage() {
    const { t, locale } = useTranslation('admin');
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
    const [filters, setFilters] = useState({ userId: 'all', action: 'all' });
    const [users, setUsers] = useState([]);

    const dateLocale = locale === 'ro' ? ro : enUS;

    // Fetch users for filter
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/admin/users');
                setUsers(res.data.users || []);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    // Fetch activities
    const fetchActivities = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pagination.limit,
                userId: filters.userId,
                action: filters.action
            };
            const res = await api.get('/admin/activity', { params });
            setActivities(res.data.activity);
            setPagination(prev => ({ ...prev, ...res.data.pagination }));
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities(pagination.page);
    }, [pagination.page, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const getActionColor = (action) => {
        if (action.includes('CREATED')) return 'bg-green-100 text-green-800';
        if (action.includes('UPDATED')) return 'bg-blue-100 text-blue-800';
        if (action.includes('DELETED')) return 'bg-red-100 text-red-800';
        if (action.includes('REJECTED')) return 'bg-orange-100 text-orange-800';
        if (action.includes('COMPLETED')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <AdminLayout>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('audit.title')}</h1>
                    <p className="text-gray-500">{t('audit.subtitle')}</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <select
                        value={filters.userId}
                        onChange={(e) => handleFilterChange('userId', e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">{t('audit.filterUser')}</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                    </select>

                    <select
                        value={filters.action}
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">{t('audit.filterAction')}</option>
                        <option value="USER_CREATED">{t('audit.actions_list.USER_CREATED')}</option>
                        <option value="USER_UPDATED">{t('audit.actions_list.USER_UPDATED')}</option>
                        <option value="USER_DELETED">{t('audit.actions_list.USER_DELETED')}</option>
                        <option value="TASK_CREATED">{t('audit.actions_list.TASK_CREATED')}</option>
                        <option value="TASK_UPDATED">{t('audit.actions_list.TASK_UPDATED')}</option>
                        <option value="TASK_DELETED">{t('audit.actions_list.TASK_DELETED')}</option>
                        <option value="TASK_COMPLETED">{t('audit.actions_list.TASK_COMPLETED')}</option>
                        <option value="TASK_REJECTED">{t('audit.actions_list.TASK_REJECTED')}</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('audit.user')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('audit.action')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('audit.details')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('audit.date')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                    </tr>
                                ))
                            ) : activities.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        {t('audit.noActivity')}
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {activity.user?.photoUrl ? (
                                                    <img className="h-8 w-8 rounded-full object-cover mr-3" src={activity.user.photoUrl} alt="" />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-xs font-bold text-gray-600">
                                                        {activity.user?.name?.substring(0, 2).toUpperCase() || '??'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{activity.user?.name || 'Unknown User'}</div>
                                                    <div className="text-xs text-gray-500">{activity.user?.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(activity.action)}`}>
                                                {/* Use translation if available, otherwise format nicely */}
                                                {(t(`audit.actions_list.${activity.action}`) !== `audit.actions_list.${activity.action}`)
                                                    ? t(`audit.actions_list.${activity.action}`)
                                                    : activity.action.replace('_', ' ')
                                                }
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {activity.details}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(activity.createdAt), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                {t('audit.results')
                                    .replace('{{start}}', (pagination.page - 1) * pagination.limit + 1)
                                    .replace('{{end}}', Math.min(pagination.page * pagination.limit, pagination.total))
                                    .replace('{{total}}', pagination.total)
                                }
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    {t('audit.prev')}
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    {t('audit.next')}
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
