'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { loadStoredAuth } from '../../../lib/authSlice';
import { fetchTasks, createTask, deleteTask } from '../../../lib/tasksSlice';
import { fetchUsers } from '../../../lib/usersSlice';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from 'date-fns';
import api from '../../../lib/api';

export default function TasksPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { tasks, loading } = useSelector((state) => state.tasks);
    const { users } = useSelector((state) => state.users);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduledDate: '',
        scheduledTime: '',
        price: '',
        assignedToId: '',
        location: '',
    });
    const [taskType, setTaskType] = useState('single');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [selectedDays, setSelectedDays] = useState({
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
    });

    // New state for improved UI
    const [activeTab, setActiveTab] = useState('ALL');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'byDriver'
    const [expandedDrivers, setExpandedDrivers] = useState({});

    // Week navigation state
    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        startOfWeek(new Date(), { weekStartsOn: 0 }) // Sunday
    );
    const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

    const navigateWeek = (direction) => {
        if (direction === 'prev') {
            setCurrentWeekStart(subWeeks(currentWeekStart, 1));
        } else if (direction === 'next') {
            setCurrentWeekStart(addWeeks(currentWeekStart, 1));
        } else {
            setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
        }
    };

    const isCurrentWeek = () => {
        const today = startOfWeek(new Date(), { weekStartsOn: 0 });
        return currentWeekStart.getTime() === today.getTime();
    };

    useEffect(() => {
        dispatch(loadStoredAuth());
    }, [dispatch]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user?.role !== 'COMPANY_ADMIN' && user?.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
        } else {
            dispatch(fetchTasks());
            dispatch(fetchUsers());
        }
    }, [isAuthenticated, user]);

    const calculateTaskDates = () => {
        if (taskType === 'single') return [];

        const { startDate, endDate } = dateRange;
        if (!startDate || !endDate) return [];

        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayName = dayMap[d.getDay()];
            if (selectedDays[dayName]) {
                dates.push(new Date(d).toISOString().split('T')[0]);
            }
        }

        return dates;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (taskType === 'single') {
                const result = await dispatch(createTask(formData));
                if (result.error) {
                    alert('Error creating task: ' + (result.error.message || result.payload));
                    return;
                }
                alert('Task created successfully!');
            } else {
                const dates = calculateTaskDates();
                if (dates.length === 0) {
                    alert('Please select at least one date and day of week');
                    return;
                }

                let created = 0;
                let failed = 0;

                for (const date of dates) {
                    const taskData = { ...formData, scheduledDate: date };
                    const result = await dispatch(createTask(taskData));
                    if (result.error) failed++;
                    else created++;
                }

                alert(`Created ${created} tasks successfully!${failed > 0 ? ` (${failed} failed)` : ''}`);
            }

            setFormData({
                title: '',
                description: '',
                scheduledDate: '',
                scheduledTime: '',
                price: '',
                assignedToId: '',
                location: '',
            });
            setDateRange({ startDate: '', endDate: '' });
            setTaskType('single');
            setShowForm(false);
        } catch (error) {
            alert('Error creating task(s): ' + error.message);
        }
    };

    const handleDelete = async (taskId) => {
        if (confirm('Are you sure you want to delete this task?')) {
            await dispatch(deleteTask(taskId));
        }
    };

    const handleComplete = async (taskId) => {
        try {
            await api.post(`/tasks/${taskId}/complete`);
            dispatch(fetchTasks());
            alert('Task marked as complete!');
        } catch (error) {
            alert('Error completing task');
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            'PENDING': { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '⏳', label: 'Pending' },
            'ACCEPTED': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '✅', label: 'Accepted' },
            'COMPLETED': { color: 'bg-green-100 text-green-800 border-green-300', icon: '🏁', label: 'Completed' },
            'REJECTED': { color: 'bg-red-100 text-red-800 border-red-300', icon: '❌', label: 'Rejected' },
            'CANCELLED': { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '🚫', label: 'Cancelled' },
        };
        return configs[status] || configs['PENDING'];
    };

    const drivers = users.filter(u => u.role === 'DRIVER');

    // Filter tasks by status tab and current week
    const getFilteredTasks = () => {
        let filtered = tasks;

        // Status filter
        if (activeTab !== 'ALL') {
            filtered = filtered.filter(t => t.status === activeTab);
        }

        // Week filter
        filtered = filtered.filter(t => {
            const taskDate = new Date(t.scheduledDate);
            return isWithinInterval(taskDate, { start: currentWeekStart, end: currentWeekEnd });
        });

        // Sort by date
        filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

        return filtered;
    };

    // Export CSV function
    const exportCSV = () => {
        const filtered = getFilteredTasks();

        if (filtered.length === 0) {
            alert('No tasks to export for this week');
            return;
        }

        // CSV Headers
        const headers = ['Date', 'Time', 'Driver', 'Driver ID', 'Title', 'Description', 'Location', 'Price (£)', 'Status'];

        // CSV Rows
        const rows = filtered.map(task => [
            format(new Date(task.scheduledDate), 'yyyy-MM-dd'),
            task.scheduledTime || '',
            task.assignedTo?.name || 'Unassigned',
            task.assignedTo?.personalId || '',
            task.title,
            (task.description || '').replace(/"/g, '""'),
            (task.location || '').replace(/"/g, '""'),
            Number(task.price).toFixed(2),
            task.status
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `routes_${format(currentWeekStart, 'yyyy-MM-dd')}_to_${format(currentWeekEnd, 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Group tasks by driver
    const getTasksByDriver = () => {
        const filtered = getFilteredTasks();
        const grouped = {};

        // Unassigned tasks
        grouped['unassigned'] = {
            driver: { id: 'unassigned', name: 'Unassigned', personalId: 'N/A' },
            tasks: filtered.filter(t => !t.assignedToId)
        };

        // Tasks by driver
        drivers.forEach(driver => {
            grouped[driver.id] = {
                driver,
                tasks: filtered.filter(t => t.assignedToId === driver.id)
            };
        });

        return grouped;
    };

    const filteredTasks = getFilteredTasks();
    const tasksByDriver = getTasksByDriver();

    // Status counts
    const statusCounts = {
        ALL: tasks.length,
        PENDING: tasks.filter(t => t.status === 'PENDING').length,
        ACCEPTED: tasks.filter(t => t.status === 'ACCEPTED').length,
        COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
        REJECTED: tasks.filter(t => t.status === 'REJECTED').length,
        CANCELLED: tasks.filter(t => t.status === 'CANCELLED').length,
    };

    const toggleDriverExpanded = (driverId) => {
        setExpandedDrivers(prev => ({
            ...prev,
            [driverId]: !prev[driverId]
        }));
    };

    if (!isAuthenticated || (user?.role !== 'COMPANY_ADMIN' && user?.role !== 'SUPER_ADMIN')) {
        return null;
    }

    const renderTaskCard = (task, compact = false) => {
        const status = getStatusConfig(task.status);

        return (
            <div
                key={task.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${status.color.split(' ')[0].replace('bg-', 'border-').replace('-100', '-500')} p-4 hover:shadow-md transition`}
            >
                <div className="flex items-start justify-between mb-2">
                    <h4 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>{task.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                        {status.icon} {status.label}
                    </span>
                </div>

                <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-2 text-sm text-gray-600 mb-3`}>
                    <div className="flex items-center gap-1">
                        <span>📅</span>
                        <span>{format(new Date(task.scheduledDate), 'MMM dd')}</span>
                    </div>
                    {task.scheduledTime && (
                        <div className="flex items-center gap-1">
                            <span>🕐</span>
                            <span>{task.scheduledTime}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                        <span>💰</span>
                        <span>£{Number(task.price).toFixed(2)}</span>
                    </div>
                    {!compact && task.assignedTo && (
                        <div className="flex items-center gap-1">
                            <span>👤</span>
                            <span>{task.assignedTo.name}</span>
                        </div>
                    )}
                </div>

                {task.location && !compact && (
                    <div className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                        <span>📍</span>
                        <span className="truncate">{task.location}</span>
                    </div>
                )}

                <div className="flex gap-2">
                    {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                        <button
                            onClick={() => handleComplete(task.id)}
                            className="flex-1 px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition"
                        >
                            ✓ Complete
                        </button>
                    )}
                    <button
                        onClick={() => handleDelete(task.id)}
                        className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header with Green Gradient */}
            <header className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/admin" className="text-white/70 hover:text-white transition">
                                ← Back
                            </Link>
                            <h1 className="text-2xl font-bold text-white">📋 Task Management</h1>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`px-4 py-2 rounded-lg transition font-medium ${showForm
                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                    : 'bg-white text-green-600 hover:bg-gray-100 shadow-lg'
                                }`}
                        >
                            {showForm ? '✕ Cancel' : '+ Create Task'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Create Task Form */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Delivery to London"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Task details..."
                                    rows="2"
                                />
                            </div>

                            {/* Task Type */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            value="single"
                                            checked={taskType === 'single'}
                                            onChange={(e) => setTaskType(e.target.value)}
                                            className="mr-2"
                                        />
                                        Single Day
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            value="multiple"
                                            checked={taskType === 'multiple'}
                                            onChange={(e) => setTaskType(e.target.value)}
                                            className="mr-2"
                                        />
                                        Recurring (Multiple Days)
                                    </label>
                                </div>
                            </div>

                            {taskType === 'single' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        value={formData.scheduledDate}
                                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                                            <input
                                                type="date"
                                                value={dateRange.startDate}
                                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                                className="w-full border rounded px-3 py-2"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                                            <input
                                                type="date"
                                                value={dateRange.endDate}
                                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                                className="w-full border rounded px-3 py-2"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2 mb-3">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                                            const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][idx];
                                            return (
                                                <label key={day} className="flex flex-col items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDays[dayKey]}
                                                        onChange={(e) => setSelectedDays({ ...selectedDays, [dayKey]: e.target.checked })}
                                                        className="mb-1"
                                                    />
                                                    <span className="text-xs">{day}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {dateRange.startDate && dateRange.endDate && (
                                        <div className="bg-white border border-blue-300 rounded px-3 py-2 text-sm text-center">
                                            📅 Will create <strong>{calculateTaskDates().length}</strong> task(s)
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={formData.scheduledTime}
                                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (£) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Driver</label>
                                <select
                                    value={formData.assignedToId}
                                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select driver...</option>
                                    {drivers.map((driver) => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.name} ({driver.personalId})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="London, UK"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    className="w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition font-medium"
                                >
                                    Create Task{taskType === 'multiple' && calculateTaskDates().length > 0 ? `s (${calculateTaskDates().length})` : ''}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Week Navigation & Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    {/* Week Navigator */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigateWeek('prev')}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                            >
                                ← Prev
                            </button>
                            <button
                                onClick={() => navigateWeek('current')}
                                disabled={isCurrentWeek()}
                                className={`px-4 py-2 rounded-lg transition ${isCurrentWeek()
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                Current Week
                            </button>
                            <button
                                onClick={() => navigateWeek('next')}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                            >
                                Next →
                            </button>
                        </div>

                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                                📅 {format(currentWeekStart, 'MMM dd')} - {format(currentWeekEnd, 'MMM dd, yyyy')}
                            </div>
                            <div className="text-sm text-gray-500">
                                Sunday to Saturday
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={exportCSV}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium flex items-center gap-2"
                            >
                                📊 Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Status Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setActiveTab(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === status
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {status === 'ALL' ? '📋' : getStatusConfig(status).icon} {status.charAt(0) + status.slice(1).toLowerCase()}
                                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                                        {statusCounts[status]}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* View Mode */}
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'byDriver' : 'list')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'byDriver' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {viewMode === 'list' ? '👤 Group by Driver' : '📋 List View'}
                        </button>
                    </div>
                </div>

                {/* Tasks Display */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    </div>
                ) : viewMode === 'list' ? (
                    /* List View */
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTasks.map(task => renderTaskCard(task))}
                    </div>
                ) : (
                    /* Group by Driver View */
                    <div className="space-y-4">
                        {Object.entries(tasksByDriver).map(([driverId, { driver, tasks: driverTasks }]) => {
                            if (driverTasks.length === 0) return null;

                            const isExpanded = expandedDrivers[driverId] !== false; // Default expanded

                            return (
                                <div key={driverId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => toggleDriverExpanded(driverId)}
                                        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${driverId === 'unassigned' ? 'bg-gray-200' : 'bg-primary-100 text-primary-600'
                                                }`}>
                                                {driverId === 'unassigned' ? '❓' : driver.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-gray-900">{driver.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {driverId === 'unassigned' ? 'Tasks not assigned' : `ID: ${driver.personalId}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-gray-900">{driverTasks.length}</span>
                                                <p className="text-xs text-gray-500">task{driverTasks.length !== 1 ? 's' : ''}</p>
                                            </div>
                                            <span className={`text-2xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 border-t border-gray-100">
                                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                {driverTasks.map(task => renderTaskCard(task, true))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {filteredTasks.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-500 text-lg">No tasks found</p>
                        <p className="text-gray-400 text-sm mt-1">Try changing the filters or create a new task</p>
                    </div>
                )}
            </main>
        </div>
    );
}
