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
import MetricCard from '../../components/MetricCard';
import ActionCard from '../../components/ActionCard';
import FloatingActionButton from '../../components/FloatingActionButton';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';

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
            // FETCH ROBUST: Use list endpoint which definitely exists on prod
            // Instead of new /pending-count endpoint which might not be deployed yet
            const response = await api.get('/timeoff?status=PENDING');
            const count = Array.isArray(response.data) ? response.data.length : 0;

            setPendingTimeOffCount(count);

            // Always show badge if there are pending requests
            if (count > 0) {
                setShowTimeOffBadge(true);
            } else {
                setShowTimeOffBadge(false);
            }
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
        <AdminLayout>
            {/* Large Gradient Metric Cards - 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <MetricCard
                    title="Active Users"
                    value={stats.totalDrivers}
                    subtitle={`${stats.totalDrivers} drivers active`}
                    icon="👥"
                    gradient="purple-pink"
                    href="/admin/users"
                />

                <MetricCard
                    title="Pending Tasks"
                    value={stats.pendingTasks}
                    subtitle={`${stats.totalTasks} total tasks`}
                    icon="📋"
                    gradient="blue-cyan"
                    progress={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks * 100) : 0}
                    href="/admin/tasks"
                />

                <MetricCard
                    title="Fleet Status"
                    value={stats.totalDrivers}
                    subtitle="Vehicles operational"
                    icon="🚗"
                    gradient="orange-red"
                    href="/admin/vehicles"
                />

                <MetricCard
                    title="Completed Tasks"
                    value={stats.completedTasks}
                    subtitle={`${stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0}% completion rate`}
                    icon="✅"
                    gradient="magenta-purple"
                    href="/admin/tasks?status=COMPLETED"
                />
            </div>

            {/* Quick Actions - Gradient Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ActionCard
                    title={t('dashboard.actions.manageUsers')}
                    description={t('dashboard.actions.manageUsersDesc')}
                    icon="👥"
                    gradient="blue"
                    href="/admin/users"
                />

                <ActionCard
                    title={t('dashboard.actions.manageTasks')}
                    description={t('dashboard.actions.manageTasksDesc')}
                    icon="📋"
                    gradient="purple"
                    href="/admin/tasks"
                />

                <ActionCard
                    title={t('dashboard.actions.weeklyReports')}
                    description={t('dashboard.actions.weeklyReportsDesc')}
                    icon="📊"
                    gradient="amber"
                    href="/admin/reports"
                />

                <ActionCard
                    title={t('dashboard.actions.driverActivity')}
                    description={t('dashboard.actions.driverActivityDesc')}
                    icon="📆"
                    gradient="green"
                    href="/admin/activity"
                />

                <ActionCard
                    title="Deductions"
                    description="Manage driver deductions & charges"
                    icon="💰"
                    gradient="purple"
                    href="/admin/deductions"
                />

                <ActionCard
                    title={t('dashboard.actions.timeOffRequests')}
                    description={pendingTimeOffCount > 0
                        ? `${pendingTimeOffCount} ${t('timeoff.pending')}`
                        : t('dashboard.actions.timeOffRequestsDesc')}
                    icon="🏖️"
                    gradient={pendingTimeOffCount > 0 ? 'red' : 'orange'}
                    highlight={pendingTimeOffCount > 0}
                    badge={pendingTimeOffCount > 0 ? pendingTimeOffCount : null}
                    href="/admin/timeoff"
                />

                <ActionCard
                    title={t('dashboard.actions.fleetVehicles') || 'Fleet Vehicles'}
                    description={t('dashboard.actions.fleetVehiclesDesc') || 'Manage vehicles, mileage, and service'}
                    icon="🚗"
                    gradient="cyan"
                    href="/admin/vehicles"
                />

                <ActionCard
                    title="Company Settings"
                    description="Manage branding and company details"
                    icon="⚙️"
                    gradient="blue"
                    href="/admin/settings"
                />
            </div>

            {/* Floating Action Button */}
            <FloatingActionButton />
        </AdminLayout>
    );
}
