'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import UnifiedBackButton from '../../../../components/UnifiedBackButton';
import UnifiedBackButton from '../../../../components/UnifiedBackButton';

export default function CompanyDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { user, token } = useSelector((state) => state.auth);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (!user || user.role !== 'SUPER_ADMIN') {
            router.push('/');
            return;
        }

        fetchCompanyDetails();
    }, [user, params.id]);

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3002/api/companies/${params.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch company details');
            }

            const data = await response.json();
            setCompany(data);
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                taxId: data.taxId || '',
                plan: data.plan || 'FREE',
                maxDrivers: data.maxDrivers || 5,
                maxVehicles: data.maxVehicles || 5,
                isActive: data.isActive !== false
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`http://localhost:3002/api/companies/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update company');
            }

            const updated = await response.json();
            setCompany(updated);
            setFormData({
                name: updated.name || '',
                email: updated.email || '',
                phone: updated.phone || '',
                address: updated.address || '',
                taxId: updated.taxId || '',
                plan: updated.plan || 'FREE',
                maxDrivers: updated.maxDrivers || 5,
                maxVehicles: updated.maxVehicles || 5,
                isActive: updated.isActive !== false
            });
            setEditing(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this company? This action cannot be undone and will delete all company data.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3002/api/companies/${params.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete company');
            }

            router.push('/super-admin');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading company details...</p>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h2>
                    <Link href="/super-admin" className="text-primary-600 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            {/* Header */}
            <header className="bg-gradient-to-r from-gray-900 to-indigo-900 shadow-lg text-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <UnifiedBackButton href="/super-admin" label="Back" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                                <p className="text-sm text-indigo-200">Company Details & Management</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!editing && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition backdrop-blur border border-white/10"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>

                            {editing ? (
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                                        <input
                                            type="text"
                                            name="taxId"
                                            value={formData.taxId}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <label className="text-sm font-medium text-gray-700">
                                            Company is Active
                                        </label>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditing(false);
                                                setFormData({
                                                    name: company.name || '',
                                                    email: company.email || '',
                                                    phone: company.phone || '',
                                                    address: company.address || '',
                                                    taxId: company.taxId || '',
                                                    plan: company.plan || 'FREE',
                                                    maxDrivers: company.maxDrivers || 5,
                                                    maxVehicles: company.maxVehicles || 5,
                                                    isActive: company.isActive !== false
                                                });
                                            }}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm text-gray-600">Company Name</label>
                                        <p className="text-lg font-medium text-gray-900">{company.name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-600">Email</label>
                                            <p className="text-gray-900">{company.email || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600">Phone</label>
                                            <p className="text-gray-900">{company.phone || '-'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Address</label>
                                        <p className="text-gray-900">{company.address || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Tax ID</label>
                                        <p className="text-gray-900">{company.taxId || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Status</label>
                                        <p>
                                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {company.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Users List */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Users ({company.users?.length || 0})</h3>
                            {company.users && company.users.length > 0 ? (
                                <div className="space-y-3">
                                    {company.users.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'COMPANY_ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'DRIVER' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                                {user.isActive !== undefined && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {user.isActive ? '✓ Active' : '✗ Inactive'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No users yet</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Subscription */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>

                            {editing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                                        <select
                                            name="plan"
                                            value={formData.plan}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="FREE">Free</option>
                                            <option value="BASIC">Basic</option>
                                            <option value="PREMIUM">Premium</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Drivers</label>
                                        <input
                                            type="number"
                                            name="maxDrivers"
                                            value={formData.maxDrivers}
                                            onChange={handleChange}
                                            min="1"
                                            max="100"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Vehicles</label>
                                        <input
                                            type="number"
                                            name="maxVehicles"
                                            value={formData.maxVehicles}
                                            onChange={handleChange}
                                            min="1"
                                            max="100"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm text-gray-600">Plan</label>
                                        <p>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${company.plan === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                                                company.plan === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {company.plan}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Driver Limit</label>
                                        <p className="text-gray-900">{company.maxDrivers}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Vehicle Limit</label>
                                        <p className="text-gray-900">{company.maxVehicles}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Statistics */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Users</span>
                                    <span className="font-medium">{company._count?.users || 0} / {company.maxDrivers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tasks</span>
                                    <span className="font-medium">{company._count?.tasks || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Vehicles</span>
                                    <span className="font-medium">{company._count?.vehicles || 0} / {company.maxVehicles}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Messages</span>
                                    <span className="font-medium">{company._count?.messages || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        {!editing && (
                            <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                                <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
                                <p className="text-sm text-red-700 mb-4">
                                    Deleting this company will permanently remove all associated data.
                                </p>
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    Delete Company
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
