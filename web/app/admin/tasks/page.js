'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { loadStoredAuth } from '../../../lib/authSlice';
import { fetchTasks, createTask, deleteTask } from '../../../lib/tasksSlice';
import { fetchUsers } from '../../../lib/usersSlice';
import { format } from 'date-fns';

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
    const [taskType, setTaskType] = useState('single'); // 'single' or 'multiple'
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
            console.log('Submitting task(s) with data:', formData);

            if (taskType === 'single') {
                // Original single task creation
                const result = await dispatch(createTask(formData));
                console.log('Task creation result:', result);

                if (result.error) {
                    alert('Error creating task: ' + (result.error.message || result.payload));
                    return;
                }

                alert('Task created successfully!');
            } else {
                // Multiple tasks for recurring
                const dates = calculateTaskDates();
                if (dates.length === 0) {
                    alert('Please select at least one date and day of week');
                    return;
                }

                console.log(`Creating ${dates.length} tasks for dates:`, dates);
                let created = 0;
                let failed = 0;

                for (const date of dates) {
                    const taskData = {
                        ...formData,
                        scheduledDate: date
                    };

                    const result = await dispatch(createTask(taskData));
                    if (result.error) {
                        failed++;
                    } else {
                        created++;
                    }
                }

                alert(`Created ${created} tasks successfully!${failed > 0 ? ` (${failed} failed)` : ''}`);
            }

            // Reset form
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
            console.error('Error creating task(s):', error);
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
            // Reload tasks
            dispatch(fetchTasks());
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

    const drivers = users.filter(u => u.role === 'DRIVER');

    if (!isAuthenticated || (user?.role !== 'COMPANY_ADMIN' && user?.role !== 'SUPER_ADMIN')) {
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
                                ← Back
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
                        >
                            {showForm ? 'Cancel' : '+ Create Task'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Create Task Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Delivery to Bucharest"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Task details..."
                                    rows="3"
                                ></textarea>
                            </div>

                            {/* Task Type Selector */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Task Type
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="single"
                                            checked={taskType === 'single'}
                                            onChange={(e) => setTaskType(e.target.value)}
                                            className="mr-2"
                                        />
                                        Single Day
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="multiple"
                                            checked={taskType === 'multiple'}
                                            onChange={(e) => setTaskType(e.target.value)}
                                            className="mr-2"
                                        />
                                        Multiple Days (Recurring)
                                    </label>
                                </div>
                            </div>

                            {taskType === 'single' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={formData.scheduledDate}
                                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="md:col-span-2">
                                    {/* Date Range */}
                                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date Range
                                        </label>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">From</label>
                                                <input
                                                    type="date"
                                                    value={dateRange.startDate}
                                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">To</label>
                                                <input
                                                    type="date"
                                                    value={dateRange.endDate}
                                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Weekday Checkboxes */}
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Repeat on:
                                        </label>
                                        <div className="grid grid-cols-7 gap-2 mb-3">
                                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                                                <label key={day} className="flex flex-col items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDays[day]}
                                                        onChange={(e) => setSelectedDays({ ...selectedDays, [day]: e.target.checked })}
                                                        className="mb-1"
                                                    />
                                                    <span className="text-xs">{day.substring(0, 3)}</span>
                                                </label>
                                            ))}
                                        </div>

                                        {/* Task Count */}
                                        {dateRange.startDate && dateRange.endDate && (
                                            <div className="bg-white border border-blue-300 rounded px-3 py-2 text-sm">
                                                📅 Will create <strong>{calculateTaskDates().length}</strong> task{calculateTaskDates().length !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                <input
                                    type="time"
                                    value={formData.scheduledTime}
                                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price (RON)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="150.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Driver</label>
                                <select
                                    value={formData.assignedToId}
                                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="">Select driver...</option>
                                    {drivers.map((driver) => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.name} ({driver.personalId})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Bucharest, Romania"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tasks Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task) => (
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

                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex items-center text-gray-700">
                                    <span className="mr-2">📅</span>
                                    <span>{format(new Date(task.scheduledDate), 'MMM dd, yyyy')}</span>
                                </div>

                                {task.scheduledTime && (
                                    <div className="flex items-center text-gray-700">
                                        <span className="mr-2">🕐</span>
                                        <span>{task.scheduledTime}</span>
                                    </div>
                                )}

                                {task.assignedTo && (
                                    <div className="flex items-center text-gray-700">
                                        <span className="mr-2">👤</span>
                                        <span>{task.assignedTo.name}</span>
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

                            {task.status !== 'COMPLETED' && (
                                <button
                                    onClick={() => handleComplete(task.id)}
                                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm mb-2"
                                >
                                    Mark Complete
                                </button>
                            )}

                            <button
                                onClick={() => handleDelete(task.id)}
                                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm"
                            >
                                Delete Task
                            </button>
                        </div>
                    ))}
                </div>

                {tasks.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-600">No tasks created yet</p>
                    </div>
                )}
            </main>
        </div>
    );
}
