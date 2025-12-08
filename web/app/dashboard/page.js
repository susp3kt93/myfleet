'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout, loadStoredAuth } from '../../lib/authSlice';
import { fetchTasks } from '../../lib/tasksSlice';
import { format, parseISO, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import api from '../../lib/api';
import MonthlyCalendar from '../../components/MonthlyCalendar';
import WeekNavigator from '../../components/WeekNavigator';
import { useTranslation } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function EnhancedDashboardPage() {
    const { t } = useTranslation('dashboard');
    const { t: tCommon } = useTranslation('common');
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { tasks, loading } = useSelector((state) => state.tasks);
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ totalTasks: 0, completedTasks: 0, monthlyEarnings: 0, rating: 0 });
    const [earnings, setEarnings] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [allTasks, setAllTasks] = useState([]);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [taskToCancel, setTaskToCancel] = useState(null);
    const [currentWeekDate, setCurrentWeekDate] = useState(new Date());

    useEffect(() => {
        dispatch(loadStoredAuth());
    }, [dispatch]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user?.role === 'ADMIN') {
            router.push('/admin');
        } else {
            loadData();
        }
    }, [isAuthenticated, user]);

    const loadData = async () => {
        try {
            console.log('[Dashboard] Loading data for user:', user?.personalId);

            // Load tasks for the next 7 days
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            console.log('[Dashboard] Fetching tasks from', today.toISOString().split('T')[0], 'to', nextWeek.toISOString().split('T')[0]);
            await dispatch(fetchTasks({
                startDate: today.toISOString().split('T')[0],
                endDate: nextWeek.toISOString().split('T')[0],
            }));

            console.log('[Dashboard] Fetching ALL tasks for calendar');
            const allTasksRes = await api.get('/tasks');
            console.log('[Dashboard] Received', allTasksRes.data.tasks?.length || 0, 'tasks from API');
            setAllTasks(allTasksRes.data.tasks || []);

            // Load statistics
            const statsRes = await api.get('/driver/stats');
            setStats(statsRes.data.stats);

            // Load earnings
            const earningsRes = await api.get('/driver/earnings?period=month');
            setEarnings(earningsRes.data.earnings);

            console.log('[Dashboard] Data loading complete');
        } catch (error) {
            console.error('[Dashboard] Error loading data:', error);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        router.push('/');
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setUploading(true);
        try {
            const res = await api.post('/driver/profile/photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('[Dashboard] Photo uploaded successfully:', res.data);

            // Fetch fresh user data from backend to get updated photoUrl
            const userRes = await api.get('/auth/me');
            if (userRes.data.user) {
                // Update localStorage with fresh user data
                const token = localStorage.getItem('token');
                localStorage.setItem('user', JSON.stringify(userRes.data.user));

                // Reload auth from localStorage to update Redux store
                dispatch(loadStoredAuth());
            }

            alert(t('profile.photoUpdated'));
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert(t('profile.photoError'));
        } finally {
            setUploading(false);
        }
    };

    const handleAcceptTask = async (taskId) => {
        try {
            await api.post(`/tasks/${taskId}/accept`);
            // Reload tasks
            loadData();
            alert('Task acceptat cu succes!');
        } catch (error) {
            console.error('Error accepting task:', error);
            alert('Eroare la acceptarea taskului.');
        }
    };

    const handleRejectTask = async (taskId) => {
        try {
            await api.post(`/tasks/${taskId}/reject`);
            // Reload tasks
            loadData();
            alert('Task respins.');
        } catch (error) {
            console.error('Error rejecting task:', error);
            alert('Eroare la respingerea taskului.');
        }
    };

    const handleCompleteTask = async () => {
        if (!taskToComplete) return;

        try {
            await api.post(`/tasks/${taskToComplete}/complete`);
            setShowCompleteModal(false);
            setTaskToComplete(null);
            // Reload tasks
            loadData();
            alert('Task marcat ca îndeplinit!');
        } catch (error) {
            console.error('Error completing task:', error);
            alert('Eroare la marcarea taskului.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACCEPTED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'IN_PROGRESS':
                return 'bg-yellow-100 text-yellow-800';
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleCancelTask = async () => {
        if (!taskToCancel) return;

        try {
            await api.post(`/tasks/${taskToCancel}/cancel`);
            setShowCancelModal(false);
            setTaskToCancel(null);
            // Reload tasks
            loadData();
            alert('Task anulat. Ratingul a scăzut cu 0.1 puncte.');
        } catch (error) {
            console.error('Error cancelling task:', error);
            alert('Eroare la anularea taskului.');
        }
    };

    const handleAcceptTaskFromCalendar = async (taskId) => {
        try {
            console.log('[Dashboard] Accepting task:', taskId);
            const response = await api.post(`/tasks/${taskId}/accept`);
            console.log('[Dashboard] Task accepted successfully:', response.data);
            // Reload tasks
            loadData();
            alert('Task acceptat cu succes!');
        } catch (error) {
            console.error('[Dashboard] Error accepting task:', error);
            console.error('[Dashboard] Error response:', error.response?.data);
            const errorMsg = error.response?.data?.error || error.message || 'Eroare necunoscută';
            alert('Eroare la acceptarea taskului: ' + errorMsg);
        }
    };

    const handleRejectTaskFromCalendar = async (taskId) => {
        try {
            console.log('[Dashboard] Rejecting task:', taskId);
            const response = await api.post(`/tasks/${taskId}/reject`);
            console.log('[Dashboard] Task rejected successfully:', response.data);
            // Reload tasks
            loadData();
            alert('Task respins!');
        } catch (error) {
            console.error('[Dashboard] Error rejecting task:', error);
            console.error('[Dashboard] Error response:', error.response?.data);
            const errorMsg = error.response?.data?.error || error.message || 'Eroare necunoscută';
            alert('Eroare la respingerea taskului: ' + errorMsg);
        }
    };

    // Check if completion button should be shown (only on scheduled date)
    const canCompleteToday = (task) => {
        const today = new Date();
        const taskDate = parseISO(task.scheduledDate);
        return isSameDay(today, taskDate);
    };

    // Filter tasks for different views:
    // - Calendar: Unassigned PENDING tasks (marketplace)
    // - Overview/Tasks tabs: My ACCEPTED tasks
    // - Completed: My COMPLETED tasks
    const pendingTasks = allTasks.filter(t => t.status === 'PENDING' && !t.assignedToId);
    const acceptedTasks = allTasks.filter(t => t.status === 'ACCEPTED' && t.assignedToId === user?.id);
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED' && t.assignedToId === user?.id)
        .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt))
        .slice(0, 10); // Last 10 completed tasks

    // Filter completed tasks for current week
    const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(currentWeekDate, { weekStartsOn: 0 }); // Saturday
    const weeklyCompletedTasks = allTasks.filter(t => {
        if (t.status !== 'COMPLETED' || t.assignedToId !== user?.id || !t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= weekStart && completedDate <= weekEnd;
    }).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    const weeklyEarnings = weeklyCompletedTasks.reduce((sum, t) => sum + Number(t.price), 0);

    const handleDownloadInvoice = async () => {
        try {
            const response = await api.get('/reports/export/pdf', {
                params: {
                    startDate: weekStart.toISOString().split('T')[0],
                    endDate: weekEnd.toISOString().split('T')[0]
                },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const weekNumber = Math.ceil((weekStart - new Date(weekStart.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
            link.setAttribute('download', `invoice-${user.personalId}-week-${weekNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('Failed to download invoice');
        }
    };

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {user.photoUrl ? (
                                <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002'}${user.photoUrl}`}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {user.name?.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                                <p className="text-sm text-gray-600">{user.personalId}</p>
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

            {/* Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {['overview', 'tasks', 'calendar', 'earnings', 'profile'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-4 font-medium capitalize transition ${activeTab === tab
                                    ? 'text-primary-600 border-b-2 border-primary-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {t(`tabs.${tab}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && stats && (
                    <div>
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">{t('stats.totalEarnings')}</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalEarnings?.toFixed(2)} RON</p>
                                    </div>
                                    <div className="text-4xl">💰</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">{t('stats.thisMonth')}</p>
                                        <p className="text-3xl font-bold text-green-600">{stats.monthlyEarnings?.toFixed(2)} RON</p>
                                    </div>
                                    <div className="text-4xl">📊</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-600">{t('stats.completedTasks')}</h3>
                                    <span className="text-2xl">✅</span>
                                </div>
                                <p className="text-3xl font-bold text-blue-600">{completedTasks.length}</p>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">{t('stats.rating')}</p>
                                        <p className="text-3xl font-bold text-yellow-600">{stats.rating?.toFixed(1) || 'N/A'}</p>
                                    </div>
                                    <div className="text-4xl">⭐</div>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Completed Tasks */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('weeklyTasks.title')}</h3>

                            <WeekNavigator
                                currentDate={currentWeekDate}
                                onDateChange={setCurrentWeekDate}
                            />

                            {weeklyCompletedTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {weeklyCompletedTasks.map((task) => (
                                        <div key={task.id} className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        📅 {t('weeklyTasks.scheduled')}: {format(parseISO(task.scheduledDate), 'dd MMM yyyy')}
                                                    </p>
                                                    <p className="text-xs text-green-600 mt-1">
                                                        ✓ {t('weeklyTasks.completed')}: {format(parseISO(task.completedAt), 'dd MMM yyyy HH:mm')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600">
                                                        {Number(task.price).toFixed(2)} RON
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Weekly Summary */}
                                    <div className="bg-primary-50 border-2 border-primary-500 rounded-lg p-4 mt-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-gray-600">{t('weeklyTasks.weeklyTotal')}</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {weeklyCompletedTasks.length} {t('weeklyTasks.tasksCompleted')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">{t('weeklyTasks.earnings')}</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {weeklyEarnings.toFixed(2)} RON
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleDownloadInvoice}
                                            className="mt-4 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            📄 Download Weekly Invoice
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
                                    <p className="text-gray-500">{t('weeklyTasks.noTasks')}</p>
                                </div>
                            )}
                        </div>

                        {/* Upcoming Tasks */}
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">{t('upcomingTasks.title')}</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {acceptedTasks.slice(0, 6).map((task) => (
                                <div key={task.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex-1">{task.title}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-gray-700">
                                            <span className="mr-2">📅</span>
                                            <span>{format(new Date(task.scheduledDate), 'dd MMM yyyy')}</span>
                                        </div>

                                        {task.location && (
                                            <div className="flex items-center text-gray-700">
                                                <span className="mr-2">📍</span>
                                                <span>{task.location}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center text-green-600 font-semibold">
                                            <span className="mr-2">💰</span>
                                            <span>{Number(task.price).toFixed(2)} RON</span>
                                        </div>
                                    </div>

                                    {task.status === 'PENDING' && (
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => handleAcceptTask(task.id)}
                                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition font-medium"
                                            >
                                                ✓ Acceptă
                                            </button>
                                            <button
                                                onClick={() => handleRejectTask(task.id)}
                                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition font-medium"
                                            >
                                                ✗ {t('tasks.reject')}
                                            </button>
                                        </div>
                                    )}

                                    {task.status === 'ACCEPTED' && canCompleteToday(task) && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => {
                                                    setTaskToComplete(task.id);
                                                    setShowCompleteModal(true);
                                                }}
                                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition font-medium"
                                            >
                                                ✓ {t('tasks.complete')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('tasks.acceptedTasks')}</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {acceptedTasks.map((task) => (
                                <div key={task.id} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex-1">{task.title}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </div>

                                    {task.description && (
                                        <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                                    )}

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-gray-700">
                                            <span className="mr-2">📅</span>
                                            <span>{format(new Date(task.scheduledDate), 'dd MMM yyyy')}</span>
                                        </div>

                                        {task.scheduledTime && (
                                            <div className="flex items-center text-gray-700">
                                                <span className="mr-2">🕐</span>
                                                <span>{task.scheduledTime}</span>
                                            </div>
                                        )}

                                        {task.location && (
                                            <div className="flex items-center text-gray-700">
                                                <span className="mr-2">📍</span>
                                                <span>{task.location}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center text-green-600 font-semibold">
                                            <span className="mr-2">💰</span>
                                            <span>{Number(task.price).toFixed(2)} RON</span>
                                        </div>
                                    </div>

                                    {task.status === 'PENDING' && (
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => handleAcceptTask(task.id)}
                                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition font-medium"
                                            >
                                                ✓ Acceptă
                                            </button>
                                            <button
                                                onClick={() => handleRejectTask(task.id)}
                                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition font-medium"
                                            >
                                                ✗ Respinge
                                            </button>
                                        </div>
                                    )}

                                    {task.status === 'ACCEPTED' && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => {
                                                    setTaskToComplete(task.id);
                                                    setShowCompleteModal(true);
                                                }}
                                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition font-medium"
                                            >
                                                ✓ Îndeplinit
                                            </button>
                                        </div>
                                    )}

                                    {task.status === 'ACCEPTED' && (
                                        <div className={canCompleteToday(task) ? "mt-2" : "mt-4"}>
                                            <button
                                                onClick={() => {
                                                    setTaskToCancel(task.id);
                                                    setShowCancelModal(true);
                                                }}
                                                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-2 rounded-lg transition font-medium text-sm"
                                            >
                                                ✗ {t('tasks.cancel')}
                                            </button>
                                        </div>
                                    )}

                                    {task.status === 'ACCEPTED' && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => handleRejectTask(task.id)}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-2 rounded-lg transition font-medium text-sm"
                                            >
                                                ✗ Respinge
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'calendar' && (
                    <div>
                        <MonthlyCalendar
                            tasks={pendingTasks}
                            onAcceptTask={handleAcceptTaskFromCalendar}
                            onRejectTask={handleRejectTaskFromCalendar}
                        />
                    </div>
                )}

                {activeTab === 'earnings' && earnings && (
                    <div>
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('earnings.monthTitle')}</h2>
                            <p className="text-4xl font-bold text-green-600">{earnings.total?.toFixed(2)} RON</p>
                            <p className="text-gray-600 mt-2">{earnings.tasks?.length} {t('earnings.tasksCompleted')}</p>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('earnings.historyTitle')}</h3>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sumă</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {earnings.tasks?.map((task) => (
                                        <tr key={task.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {task.title}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(task.completedAt), 'dd MMM yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                                                {task.amount?.toFixed(2)} RON
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.title')}</h2>

                        <div className="mb-8 flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                            <div className="relative group">
                                {user.photoUrl ? (
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002'}${user.photoUrl}`}
                                        alt={user.name}
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-4xl border-4 border-white shadow-lg">
                                        {user.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50 transition">
                                    <span className="sr-only">Schimbă poza</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                                <p className="text-gray-500">{user.role === 'DRIVER' ? t('profile.driver') : user.role}</p>
                                <p className="text-sm text-gray-400 mt-1">ID: {user.personalId}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.name')}</label>
                                <input
                                    type="text"
                                    value={user.name}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.email')}</label>
                                <input
                                    type="email"
                                    value={user.email || ''}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.phone')}</label>
                                <input
                                    type="tel"
                                    value={user.phone || ''}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.personalId')}</label>
                                <input
                                    type="text"
                                    value={user.personalId}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.vehicleInfo')}</h3>
                            <p className="text-gray-600">{t('profile.comingSoon')}</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Completion Confirmation Modal */}
            {showCompleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('modals.confirmation')}</h3>
                        <p className="text-gray-700 mb-6">{t('modals.confirmComplete')}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowCompleteModal(false);
                                    setTaskToComplete(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                            >
                                {t('modals.cancel')}
                            </button>
                            <button
                                onClick={handleCompleteTask}
                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                            >
                                {t('modals.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">⚠️ {t('modals.warning')}</h3>
                        <p className="text-gray-700 mb-2">{t('modals.confirmCancelTask')}</p>
                        <p className="text-red-600 font-semibold mb-6">{t('modals.ratingPenalty')}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setTaskToCancel(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                            >
                                {t('modals.back')}
                            </button>
                            <button
                                onClick={handleCancelTask}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                            >
                                {t('modals.confirmCancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
