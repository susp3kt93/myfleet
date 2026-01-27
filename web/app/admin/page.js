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
import DonutChart from '../../components/charts/DonutChart';
import TasksPerUserChart from '../../components/charts/TasksPerUserChart';
import TaskTrendChart from '../../components/charts/TaskTrendChart';
import ActivityFeed from '../../components/ActivityFeed';
import TaskCalendarHeatMap from '../../components/TaskCalendarHeatMap';
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
    const [vehicles, setVehicles] = useState([]);

    // Analytics data
    const [taskStatusData, setTaskStatusData] = useState(null);
    const [userPerformanceData, setUserPerformanceData] = useState(null);
    const [taskTrendData, setTaskTrendData] = useState(null);
    const [activityData, setActivityData] = useState(null);
    const [calendarData, setCalendarData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState(null);



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
            fetchVehicles();
            fetchAnalyticsData();
        }
    }, [isAuthenticated, user]);

    const fetchTimeOffCount = async () => {
        try {
            // FETCH ROBUST: Use list endpoint which definitely exists on prod
            // Instead of new /pending-count endpoint which might not be deployed yet
            const response = await api.get('/timeoff?status=PENDING');
            const count = Array.isArray(response.data) ? response.data.length : 0;

            setPendingTimeOffCount(count);
            setShowTimeOffBadge(count > 0);
        } catch (error) {
            console.error('Error fetching time off count:', error);
            setPendingTimeOffCount(0);
        }
    };

    const fetchVehicles = async () => {
        try {
            const response = await api.get('/vehicles');
            setVehicles(response.data || []);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setVehicles([]);
        }
    };

    const fetchAnalyticsData = async () => {
        try {
            setAnalyticsLoading(true);
            setAnalyticsError(null);

            // Fetch task status distribution
            const statusResponse = await api.get('/analytics/tasks/status-distribution');
            setTaskStatusData(statusResponse.data);

            // Fetch user performance
            const performanceResponse = await api.get('/analytics/users/performance?limit=10');
            setUserPerformanceData(performanceResponse.data);

            // Fetch task trend
            const trendResponse = await api.get('/analytics/tasks/trend?days=7');
            setTaskTrendData(trendResponse.data);

            // Fetch recent activity
            const activityResponse = await api.get('/analytics/activity/recent?limit=20');
            setActivityData(activityResponse.data);

            // Fetch calendar data for current month
            const now = new Date();
            const monthParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const calendarResponse = await api.get(`/analytics/tasks/calendar?month=${monthParam}`);
            setCalendarData(calendarResponse.data);

            setAnalyticsLoading(false);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            setAnalyticsError('Failed to load analytics data');
            setAnalyticsLoading(false);
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
        totalVehicles: vehicles.length,
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
                    value={stats.totalVehicles}
                    subtitle={`${stats.totalVehicles} vehicles operational`}
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

            {/* Analytics Charts Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Overview</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DonutChart
                        data={taskStatusData}
                        loading={analyticsLoading}
                        error={analyticsError}
                    />
                    <TasksPerUserChart
                        data={userPerformanceData}
                        loading={analyticsLoading}
                        error={analyticsError}
                    />
                </div>

                {/* Full-width Trend Chart */}
                <div className="mt-6">
                    <TaskTrendChart
                        data={taskTrendData}
                        loading={analyticsLoading}
                        error={analyticsError}
                        days={7}
                    />
                </div>

                {/* Activity Feed and Calendar - Side by Side on Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <ActivityFeed
                        data={activityData}
                        loading={analyticsLoading}
                        error={analyticsError}
                        autoRefresh={false}
                    />
                    <TaskCalendarHeatMap
                        data={calendarData}
                        loading={analyticsLoading}
                        error={analyticsError}
                    />
                </div>
            </div>



            {/* Floating Action Button */}
            <FloatingActionButton />
        </AdminLayout >
    );
}
