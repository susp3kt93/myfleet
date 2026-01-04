'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout, loadStoredAuth } from '../../lib/authSlice';
import { fetchTasks } from '../../lib/tasksSlice';
import { format, parseISO, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks, eachDayOfInterval, isWithinInterval } from 'date-fns';
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
    // Time off state
    const [timeOffRequests, setTimeOffRequests] = useState([]);
    const [timeOffLoading, setTimeOffLoading] = useState(false);
    const [timeOffType, setTimeOffType] = useState('single'); // 'single' or 'range'
    const [newTimeOffDate, setNewTimeOffDate] = useState('');
    const [newTimeOffStartDate, setNewTimeOffStartDate] = useState('');
    const [newTimeOffEndDate, setNewTimeOffEndDate] = useState('');
    const [newTimeOffReason, setNewTimeOffReason] = useState('');
    const [timeOffSubmitting, setTimeOffSubmitting] = useState(false);
    // Vehicle state
    const [myVehicle, setMyVehicle] = useState(null);
    const [vehicleLoading, setVehicleLoading] = useState(false);
    const [newMileage, setNewMileage] = useState('');
    const [mileageUpdating, setMileageUpdating] = useState(false);
    // Earnings week navigation state
    const [earningsWeekStart, setEarningsWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));

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
    // - Overview/Tasks tabs: My PENDING + ACCEPTED tasks (assigned to me)
    // - Completed: My COMPLETED tasks
    const pendingTasks = allTasks.filter(t => t.status === 'PENDING' && !t.assignedToId);
    const myPendingTasks = allTasks.filter(t => t.status === 'PENDING' && t.assignedToId === user?.id);
    const myAcceptedTasks = allTasks.filter(t => t.status === 'ACCEPTED' && t.assignedToId === user?.id);
    const acceptedTasks = [...myPendingTasks, ...myAcceptedTasks]; // All my active tasks (pending + accepted)
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
            // Always use CURRENT date to get this week's invoice (Sunday-Saturday)
            const today = new Date();
            const invoiceWeekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
            const invoiceWeekEnd = endOfWeek(today, { weekStartsOn: 0 }); // Saturday

            // Use format() to get local timezone dates (not UTC)
            const startDateStr = format(invoiceWeekStart, 'yyyy-MM-dd');
            const endDateStr = format(invoiceWeekEnd, 'yyyy-MM-dd');

            console.log('Invoice week:', startDateStr, 'to', endDateStr);

            const response = await api.get('/reports/export/pdf', {
                params: {
                    startDate: startDateStr,
                    endDate: endDateStr
                },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const weekNumber = Math.ceil((invoiceWeekStart - new Date(invoiceWeekStart.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
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
        <div className="min-h-screen bg-gray-100">
            {/* Header with Green Gradient */}
            <header className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {user.photoUrl ? (
                                <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002'}${user.photoUrl}`}
                                    alt={user.name}
                                    className="w-14 h-14 rounded-full object-cover border-3 border-white/30 shadow-lg"
                                />
                            ) : (
                                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    {user.name?.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                                <p className="text-sm text-white/70">{user.personalId}</p>
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

            {/* Modern Tabs */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-2 py-3 overflow-x-auto">
                        {['overview', 'tasks', 'calendar', 'earnings', 'timeoff', 'profile'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 font-medium capitalize transition rounded-xl whitespace-nowrap ${activeTab === tab
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {tab === 'overview' && '🏠 '}
                                {tab === 'tasks' && '📋 '}
                                {tab === 'calendar' && '📅 '}
                                {tab === 'earnings' && '💰 '}
                                {tab === 'timeoff' && '🏖️ '}
                                {tab === 'profile' && '👤 '}
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
                            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">{t('stats.totalEarnings')}</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEarnings?.toFixed(2)} £</p>
                                    </div>
                                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">💰</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-l-4 border-emerald-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">{t('stats.thisMonth')}</p>
                                        <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.monthlyEarnings?.toFixed(2)} £</p>
                                    </div>
                                    <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-3xl">📊</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">{t('stats.completedTasks')}</p>
                                        <p className="text-3xl font-bold text-blue-600 mt-1">{completedTasks.length}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl">✅</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-l-4 border-amber-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">{t('stats.rating')}</p>
                                        <p className="text-3xl font-bold text-amber-600 mt-1">{stats.rating?.toFixed(1) || 'N/A'}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center text-3xl">⭐</div>
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
                                                        {Number(task.price).toFixed(2)} £
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
                                                    {weeklyEarnings.toFixed(2)} £
                                                </p>
                                            </div>
                                        </div>
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
                                            <span>{Number(task.price).toFixed(2)} £</span>
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
                                            <span>{Number(task.price).toFixed(2)} £</span>
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

                {activeTab === 'earnings' && (
                    <div className="space-y-6">
                        {/* Week Navigator & Header */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <h2 className="text-2xl font-bold">💰 Weekly Earnings</h2>
                                <button
                                    onClick={handleDownloadInvoice}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition flex items-center gap-2 font-medium"
                                >
                                    📄 Download Invoice
                                </button>
                            </div>

                            {/* Week Navigation */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEarningsWeekStart(subWeeks(earningsWeekStart, 1))}
                                        className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        onClick={() => setEarningsWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                                    >
                                        Current Week
                                    </button>
                                    <button
                                        onClick={() => setEarningsWeekStart(addWeeks(earningsWeekStart, 1))}
                                        className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                                    >
                                        Next →
                                    </button>
                                </div>

                                <div className="text-center">
                                    <div className="text-xl font-bold">
                                        {format(earningsWeekStart, 'MMM dd')} - {format(endOfWeek(earningsWeekStart, { weekStartsOn: 0 }), 'MMM dd, yyyy')}
                                    </div>
                                    <div className="text-white/70 text-sm">Sunday to Saturday</div>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Summary Cards */}
                        {(() => {
                            const weekEnd = endOfWeek(earningsWeekStart, { weekStartsOn: 0 });
                            const weekDays = eachDayOfInterval({ start: earningsWeekStart, end: weekEnd });
                            const weekTasks = allTasks.filter(task => {
                                const taskDate = new Date(task.scheduledDate);
                                return isWithinInterval(taskDate, { start: earningsWeekStart, end: weekEnd });
                            });
                            const completedWeekTasks = weekTasks.filter(t => t.status === 'COMPLETED');
                            const weekTotal = completedWeekTasks.reduce((sum, t) => sum + Number(t.price || 0), 0);
                            const daysWorked = weekDays.filter(day =>
                                completedWeekTasks.some(t => isSameDay(new Date(t.scheduledDate), day))
                            ).length;

                            return (
                                <>
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-xl shadow p-4 text-center">
                                            <p className="text-3xl font-bold text-green-600">£{weekTotal.toFixed(2)}</p>
                                            <p className="text-sm text-gray-500">Week Total</p>
                                        </div>
                                        <div className="bg-white rounded-xl shadow p-4 text-center">
                                            <p className="text-3xl font-bold text-blue-600">{daysWorked}</p>
                                            <p className="text-sm text-gray-500">Days Worked</p>
                                        </div>
                                        <div className="bg-white rounded-xl shadow p-4 text-center">
                                            <p className="text-3xl font-bold text-purple-600">{completedWeekTasks.length}</p>
                                            <p className="text-sm text-gray-500">Tasks Completed</p>
                                        </div>
                                        <div className="bg-white rounded-xl shadow p-4 text-center">
                                            <p className="text-3xl font-bold text-amber-600">
                                                £{daysWorked > 0 ? (weekTotal / daysWorked).toFixed(2) : '0.00'}
                                            </p>
                                            <p className="text-sm text-gray-500">Avg per Day</p>
                                        </div>
                                    </div>

                                    {/* Weekly Calendar Grid */}
                                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-3 border-b">
                                            <h3 className="font-bold text-gray-800">📅 Week Activity</h3>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {weekDays.map(day => {
                                                const dayTasks = allTasks.filter(t =>
                                                    isSameDay(new Date(t.scheduledDate), day)
                                                );
                                                const completedDayTasks = dayTasks.filter(t => t.status === 'COMPLETED');
                                                const dayEarnings = completedDayTasks.reduce((sum, t) => sum + Number(t.price || 0), 0);
                                                const isToday = isSameDay(day, new Date());
                                                const isPast = day < new Date() && !isToday;

                                                return (
                                                    <div
                                                        key={day.toISOString()}
                                                        className={`flex items-center px-6 py-4 ${isToday ? 'bg-blue-50' : ''}`}
                                                    >
                                                        {/* Day Info */}
                                                        <div className="w-32 flex-shrink-0">
                                                            <p className={`font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                                                                {format(day, 'EEEE')}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {format(day, 'dd MMM')}
                                                            </p>
                                                        </div>

                                                        {/* Tasks */}
                                                        <div className="flex-1 px-4">
                                                            {dayTasks.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {dayTasks.map(task => (
                                                                        <div
                                                                            key={task.id}
                                                                            className={`px-3 py-1 rounded-full text-sm font-medium ${task.status === 'COMPLETED'
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : task.status === 'ACCEPTED'
                                                                                    ? 'bg-blue-100 text-blue-800'
                                                                                    : task.status === 'PENDING'
                                                                                        ? 'bg-amber-100 text-amber-800'
                                                                                        : 'bg-gray-100 text-gray-600'
                                                                                }`}
                                                                        >
                                                                            {task.status === 'COMPLETED' && '✅ '}
                                                                            {task.status === 'ACCEPTED' && '📋 '}
                                                                            {task.status === 'PENDING' && '⏳ '}
                                                                            {task.title}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 italic">
                                                                    {isPast ? '— No tasks' : 'No tasks scheduled'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Earnings */}
                                                        <div className="w-24 text-right">
                                                            {dayEarnings > 0 ? (
                                                                <span className="text-lg font-bold text-green-600">
                                                                    £{dayEarnings.toFixed(2)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">£0.00</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Week Total Footer */}
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex justify-between items-center text-white">
                                            <span className="font-bold text-lg">Week Total</span>
                                            <span className="text-2xl font-bold">£{weekTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚗 {t('profile.vehicleInfo') || 'My Vehicle'}</h3>

                            {vehicleLoading ? (
                                <div className="animate-pulse bg-gray-100 rounded-lg p-4 h-24"></div>
                            ) : myVehicle ? (
                                <div className="bg-gray-50 rounded-lg p-4 border">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900">{myVehicle.plate}</h4>
                                            <p className="text-gray-600">{myVehicle.make} {myVehicle.model} {myVehicle.year}</p>
                                            <p className="text-sm text-gray-500">{myVehicle.type} • {myVehicle.color}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${myVehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            myVehicle.status === 'NEEDS_SERVICE' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {myVehicle.status === 'ACTIVE' ? '✅ Active' :
                                                myVehicle.status === 'NEEDS_SERVICE' ? '⚠️ Needs Service' :
                                                    '🔧 In Service'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-sm text-gray-600">Current Mileage</label>
                                            <p className="font-bold text-lg">{myVehicle.currentMileage?.toLocaleString()} {myVehicle.mileageUnit}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600">Next Service</label>
                                            <p className="font-medium">{myVehicle.nextServiceMileage?.toLocaleString()} {myVehicle.mileageUnit}</p>
                                            {myVehicle.nextServiceMileage && (
                                                <p className={`text-sm ${(myVehicle.nextServiceMileage - myVehicle.currentMileage) <= 300 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                                    {myVehicle.nextServiceMileage - myVehicle.currentMileage} {myVehicle.mileageUnit} remaining
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">📝 Update Mileage</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={newMileage}
                                                onChange={(e) => setNewMileage(e.target.value)}
                                                placeholder={myVehicle.currentMileage.toString()}
                                                min={myVehicle.currentMileage}
                                                className="flex-1 px-3 py-2 border rounded-lg"
                                            />
                                            <button
                                                onClick={async () => {
                                                    if (!newMileage || parseInt(newMileage) < myVehicle.currentMileage) {
                                                        alert('Mileage must be greater than current reading');
                                                        return;
                                                    }
                                                    setMileageUpdating(true);
                                                    try {
                                                        const res = await api.put(`/vehicles/${myVehicle.id}/mileage`, { mileage: parseInt(newMileage) });
                                                        setMyVehicle(res.data);
                                                        setNewMileage('');
                                                        alert('Mileage updated!');
                                                    } catch (error) {
                                                        alert(error.response?.data?.error || 'Failed to update mileage');
                                                    } finally {
                                                        setMileageUpdating(false);
                                                    }
                                                }}
                                                disabled={mileageUpdating || !newMileage}
                                                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50"
                                            >
                                                {mileageUpdating ? '...' : 'Update'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-6 text-center">
                                    <p className="text-gray-500">🚗 No vehicle assigned to you yet.</p>
                                    <p className="text-sm text-gray-400 mt-1">Your admin will assign a vehicle when available.</p>
                                </div>
                            )}

                            <button
                                onClick={async () => {
                                    setVehicleLoading(true);
                                    try {
                                        const res = await api.get('/vehicles/my');
                                        setMyVehicle(res.data);
                                    } catch (error) {
                                        console.error('Error loading vehicle:', error);
                                    } finally {
                                        setVehicleLoading(false);
                                    }
                                }}
                                className="mt-4 text-sm text-primary-600 hover:text-primary-800"
                            >
                                🔄 Refresh Vehicle Info
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'timeoff' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">🏖️ Time Off Requests</h2>

                        {/* Request Form */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Time Off</h3>

                            {/* Request Type Toggle */}
                            <div className="flex gap-4 mb-4">
                                <button
                                    onClick={() => setTimeOffType('single')}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${timeOffType === 'single'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    📅 Single Day
                                </button>
                                <button
                                    onClick={() => setTimeOffType('range')}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${timeOffType === 'range'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    🗓️ Vacation Period
                                </button>
                            </div>

                            {timeOffType === 'single' ? (
                                /* Single Day Form */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                        <input
                                            type="date"
                                            value={newTimeOffDate}
                                            onChange={(e) => setNewTimeOffDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                                        <input
                                            type="text"
                                            value={newTimeOffReason}
                                            onChange={(e) => setNewTimeOffReason(e.target.value)}
                                            placeholder="e.g., Personal day, Medical appointment..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* Date Range Form */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={newTimeOffStartDate}
                                                onChange={(e) => setNewTimeOffStartDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                            <input
                                                type="date"
                                                value={newTimeOffEndDate}
                                                onChange={(e) => setNewTimeOffEndDate(e.target.value)}
                                                min={newTimeOffStartDate || new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                                        <input
                                            type="text"
                                            value={newTimeOffReason}
                                            onChange={(e) => setNewTimeOffReason(e.target.value)}
                                            placeholder="e.g., Vacation, Holiday trip..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    {newTimeOffStartDate && newTimeOffEndDate && (
                                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                            📊 This will create <strong>{Math.max(1, Math.ceil((new Date(newTimeOffEndDate) - new Date(newTimeOffStartDate)) / (1000 * 60 * 60 * 24)) + 1)}</strong> day(s) of time off requests
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={async () => {
                                    if (timeOffType === 'single' && !newTimeOffDate) {
                                        alert('Please select a date');
                                        return;
                                    }
                                    if (timeOffType === 'range' && (!newTimeOffStartDate || !newTimeOffEndDate)) {
                                        alert('Please select start and end dates');
                                        return;
                                    }
                                    setTimeOffSubmitting(true);
                                    try {
                                        const payload = timeOffType === 'single'
                                            ? { requestDate: newTimeOffDate, reason: newTimeOffReason || null }
                                            : { startDate: newTimeOffStartDate, endDate: newTimeOffEndDate, reason: newTimeOffReason || null };

                                        const response = await api.post('/timeoff', payload);

                                        // Reset form
                                        setNewTimeOffDate('');
                                        setNewTimeOffStartDate('');
                                        setNewTimeOffEndDate('');
                                        setNewTimeOffReason('');

                                        // Reload requests
                                        const res = await api.get('/timeoff');
                                        setTimeOffRequests(res.data);

                                        const count = response.data.count || 1;
                                        alert(`Time off request${count > 1 ? 's' : ''} submitted! (${count} day${count > 1 ? 's' : ''})`);
                                    } catch (error) {
                                        console.error('Error submitting time off:', error);
                                        alert(error.response?.data?.error || 'Failed to submit request');
                                    } finally {
                                        setTimeOffSubmitting(false);
                                    }
                                }}
                                disabled={timeOffSubmitting || (timeOffType === 'single' ? !newTimeOffDate : (!newTimeOffStartDate || !newTimeOffEndDate))}
                                className="mt-4 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {timeOffSubmitting ? 'Submitting...' : (timeOffType === 'single' ? '📅 Request Day Off' : '🏖️ Request Vacation')}
                            </button>
                        </div>

                        {/* My Requests */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">My Requests</h3>
                                <button
                                    onClick={async () => {
                                        setTimeOffLoading(true);
                                        try {
                                            const res = await api.get('/timeoff');
                                            setTimeOffRequests(res.data);
                                        } catch (error) {
                                            console.error('Error loading time off:', error);
                                        } finally {
                                            setTimeOffLoading(false);
                                        }
                                    }}
                                    className="text-sm text-primary-600 hover:text-primary-800"
                                >
                                    🔄 Refresh
                                </button>
                            </div>

                            {timeOffLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Loading...</p>
                                </div>
                            ) : timeOffRequests.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No time off requests yet.</p>
                                    <p className="text-sm text-gray-400 mt-1">Use the form above to request a day off.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {timeOffRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className={`p-4 rounded-lg border-l-4 ${request.status === 'PENDING' ? 'bg-yellow-50 border-yellow-500' :
                                                request.status === 'APPROVED' ? 'bg-green-50 border-green-500' :
                                                    'bg-red-50 border-red-500'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold">
                                                            {request.endDate ? (
                                                                <>
                                                                    🗓️ {format(new Date(request.requestDate), 'dd MMM yyyy')} → {format(new Date(request.endDate), 'dd MMM yyyy')}
                                                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                        {Math.ceil((new Date(request.endDate) - new Date(request.requestDate)) / (1000 * 60 * 60 * 24)) + 1} days
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>📅 {format(new Date(request.requestDate), 'EEEE, dd MMMM yyyy')}</>
                                                            )}
                                                        </span>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                            request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {request.status === 'PENDING' ? '⏳ Pending' :
                                                                request.status === 'APPROVED' ? '✅ Approved' :
                                                                    '❌ Rejected'}
                                                        </span>
                                                    </div>
                                                    {request.reason && (
                                                        <p className="text-sm text-gray-600 mt-1">Reason: {request.reason}</p>
                                                    )}
                                                    {request.adminNotes && (
                                                        <p className="text-sm text-gray-500 mt-1 italic">Admin notes: {request.adminNotes}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        Requested: {format(new Date(request.createdAt), 'dd MMM yyyy HH:mm')}
                                                    </p>
                                                </div>
                                                {request.status === 'PENDING' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Are you sure you want to cancel this request?')) return;
                                                            try {
                                                                await api.delete(`/timeoff/${request.id}`);
                                                                setTimeOffRequests(timeOffRequests.filter(r => r.id !== request.id));
                                                                alert('Request cancelled');
                                                            } catch (error) {
                                                                console.error('Error cancelling:', error);
                                                                alert('Failed to cancel request');
                                                            }
                                                        }}
                                                        className="text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
