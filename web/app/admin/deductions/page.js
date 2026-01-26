'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import api from '../../../lib/api';
import AdminLayout from '../../../components/AdminLayout';
import { PrimaryButton } from '../../../components/Buttons';
import Link from 'next/link';
import { BackButton } from '../../../components/Buttons';

export default function DeductionsPage() {
    const router = useRouter();
    const { user } = useSelector((state) => state.auth);
    const [deductions, setDeductions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDeduction, setEditingDeduction] = useState(null);
    const [drivers, setDrivers] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        userId: '',
        type: 'VAN_RENTAL',
        description: '',
        amount: '',
        frequency: 'WEEKLY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });

    useEffect(() => {
        console.log('[Deductions] User:', user);
        console.log('[Deductions] User role:', user?.role);

        if (!user) {
            console.log('[Deductions] No user found, redirecting to login');
            router.push('/');
            return;
        }

        if (user.role !== 'COMPANY_ADMIN' && user.role !== 'SUPER_ADMIN') {
            console.log('[Deductions] User role not authorized:', user.role);
            router.push('/admin');
            return;
        }

        console.log('[Deductions] User authorized, loading data');
        loadData();
    }, [user, router]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [deductionsRes, driversRes] = await Promise.all([
                api.get('/deductions'),
                api.get('/users?role=DRIVER')
            ]);
            setDeductions(deductionsRes.data.deductions || []);
            setDrivers(driversRes.data.users || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDeduction) {
                await api.put(`/deductions/${editingDeduction.id}`, formData);
            } else {
                await api.post('/deductions', formData);
            }
            setShowModal(false);
            setEditingDeduction(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving deduction:', error);
            alert('Failed to save deduction');
        }
    };

    const handleEdit = (deduction) => {
        setEditingDeduction(deduction);
        setFormData({
            userId: deduction.userId,
            type: deduction.type,
            description: deduction.description,
            amount: deduction.amount.toString(),
            frequency: deduction.frequency,
            startDate: new Date(deduction.startDate).toISOString().split('T')[0],
            endDate: deduction.endDate ? new Date(deduction.endDate).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this deduction?')) return;
        try {
            await api.delete(`/deductions/${id}`);
            loadData();
        } catch (error) {
            console.error('Error deleting deduction:', error);
            alert('Failed to delete deduction');
        }
    };

    const handleStatusToggle = async (deduction) => {
        try {
            const newStatus = deduction.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await api.put(`/deductions/${deduction.id}`, { status: newStatus });
            loadData();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const resetForm = () => {
        setFormData({
            userId: '',
            type: 'VAN_RENTAL',
            description: '',
            amount: '',
            frequency: 'WEEKLY',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
        });
    };

    const getTypeIcon = (type) => {
        const icons = {
            VAN_RENTAL: '🚐',
            PENALTY: '⚠️',
            INSURANCE: '🛡️',
            FUEL: '⛽',
            EQUIPMENT: '📱',
            OTHER: '📋'
        };
        return icons[type] || '📋';
    };

    const getTypeColor = (type) => {
        const colors = {
            VAN_RENTAL: 'bg-blue-100 text-blue-800',
            PENALTY: 'bg-red-100 text-red-800',
            INSURANCE: 'bg-green-100 text-green-800',
            FUEL: 'bg-yellow-100 text-yellow-800',
            EQUIPMENT: 'bg-purple-100 text-purple-800',
            OTHER: 'bg-gray-100 text-gray-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <BackButton href="/admin" label="Back" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">💰 Deductions Management</h1>
                        <p className="text-sm text-gray-500">Manage driver deductions and charges</p>
                    </div>
                </div>
                <PrimaryButton onClick={() => {
                    setEditingDeduction(null);
                    resetForm();
                    setShowModal(true);
                }}>
                    + Add Deduction
                </PrimaryButton>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500 font-medium">Total Deductions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{deductions.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                    <p className="text-sm text-gray-500 font-medium">Active</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                        {deductions.filter(d => d.status === 'ACTIVE').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                    <p className="text-sm text-gray-500 font-medium">Weekly Total</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                        £{deductions.filter(d => d.status === 'ACTIVE' && d.frequency === 'WEEKLY')
                            .reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-500 font-medium">Monthly Total</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                        £{deductions.filter(d => d.status === 'ACTIVE' && d.frequency === 'MONTHLY')
                            .reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Deductions Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {deductions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No deductions found. Click "Add Deduction" to create one.
                                    </td>
                                </tr>
                            ) : (
                                deductions.map((deduction) => (
                                    <tr key={deduction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{deduction.user.name}</div>
                                            <div className="text-sm text-gray-500">{deduction.user.personalId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(deduction.type)}`}>
                                                {getTypeIcon(deduction.type)} {deduction.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{deduction.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-red-600">-£{deduction.amount.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">{deduction.frequency}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleStatusToggle(deduction)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deduction.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {deduction.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEdit(deduction)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(deduction.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingDeduction ? 'Edit Deduction' : 'Add New Deduction'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                                <select
                                    value={formData.userId}
                                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={!!editingDeduction}
                                >
                                    <option value="">Select Driver</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.name} ({driver.personalId})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="VAN_RENTAL">Van Rental</option>
                                    <option value="PENALTY">Penalty</option>
                                    <option value="INSURANCE">Insurance</option>
                                    <option value="FUEL">Fuel</option>
                                    <option value="EQUIPMENT">Equipment</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Weekly van rental - Mercedes Sprinter"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (£)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="250.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="ONE_TIME">One Time</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingDeduction(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingDeduction ? 'Update' : 'Create'} Deduction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }
        </AdminLayout>
    );
}
