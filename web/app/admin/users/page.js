'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UnifiedBackButton from '../../../components/UnifiedBackButton';
import { useDispatch, useSelector } from 'react-redux';
import { loadStoredAuth } from '../../../lib/authSlice';
import { fetchUsers, createUser, deleteUser, updateUser } from '../../../lib/usersSlice';
import { useTranslation } from '../../../contexts/LanguageContext';
import AdminLayout from '../../../components/AdminLayout';
import { BackButton, PrimaryButton, DangerButton } from '../../../components/Buttons';

export default function UsersPage() {
    const { t } = useTranslation('admin');
    const { t: tCommon } = useTranslation('common');
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { users, loading } = useSelector((state) => state.users);
    const [showForm, setShowForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        personalId: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'DRIVER',
    });
    const [editFormData, setEditFormData] = useState({
        personalId: '',
        name: '',
        email: '',
        phone: '',
        rating: 3.0,
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
            dispatch(fetchUsers());
        }
    }, [isAuthenticated, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await dispatch(createUser(formData));
        setFormData({
            personalId: '',
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'DRIVER',
        });
        setShowForm(false);
    };

    const handleDelete = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            await dispatch(deleteUser(userToDelete.id));
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setEditFormData({
            personalId: user.personalId,
            name: user.name,
            email: user.email || '',
            phone: user.phone || '',
            rating: user.rating || 3.0,
        });
        setShowEditModal(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(updateUser({ id: editingUser.id, updates: editFormData }));
            setShowEditModal(false);
            setEditingUser(null);
            alert('User updated successfully!');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user');
        }
    };

    if (!isAuthenticated || (user?.role !== 'COMPANY_ADMIN' && user?.role !== 'SUPER_ADMIN')) {
        return null;
    }

    return (
        <AdminLayout>
            {/* Page Header */}
            {/* Page Header (Responsive) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center justify-between sm:justify-start space-x-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-white/50 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                        <BackButton href="/admin" label="Back" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">👥 User Management</h1>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-center ${showForm
                        ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                        : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                        }`}
                >
                    {showForm ? '✕ Cancel' : '+ Add User'}
                </button>
            </div>
            {/* Add User Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Create New User</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Personal ID</label>
                            <input
                                type="text"
                                value={formData.personalId}
                                onChange={(e) => setFormData({ ...formData, personalId: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="DRV-004"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="+40700000000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="DRIVER">Driver</option>
                                {user?.role === 'SUPER_ADMIN' && <option value="COMPANY_ADMIN">Company Admin</option>}
                                {user?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
                            >
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Personal ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {u.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{u.personalId}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{u.email || '-'}</div>
                                    <div className="text-sm text-gray-500">{u.phone || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                                        u.role === 'COMPANY_ADMIN' ? 'bg-purple-100 text-purple-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {u.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                            u.role === 'COMPANY_ADMIN' ? 'Company Admin' :
                                                u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {u.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(u)}
                                        className="text-primary-600 hover:text-primary-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u)}
                                        className="text-red-600 hover:text-red-900"
                                        disabled={u.id === user.id}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User: {editingUser.name}</h2>
                        <form onSubmit={handleUpdateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Personal ID</label>
                                <input
                                    type="text"
                                    value={editFormData.personalId}
                                    onChange={(e) => setEditFormData({ ...editFormData, personalId: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1.0"
                                    max="5.0"
                                    value={editFormData.rating}
                                    onChange={(e) => setEditFormData({ ...editFormData, rating: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div className="md:col-span-2 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                            Delete User
                        </h3>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            Are you sure you want to delete <strong>{userToDelete.name}</strong> ({userToDelete.personalId})?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setUserToDelete(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
