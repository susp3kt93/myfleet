'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';

export default function UsersListPage() {
    const router = useRouter();
    const { user, token } = useSelector((state) => state.auth);
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        companyId: '',
        role: '',
        search: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'SUPER_ADMIN') {
            router.push('/');
            return;
        }

        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch users
            const usersRes = await fetch('http://localhost:3002/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);

            // Fetch companies
            const companiesRes = await fetch('http://localhost:3002/api/companies', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const companiesData = await companiesRes.json();
            const companiesList = Array.isArray(companiesData) ? companiesData : (companiesData.companies || []);
            setCompanies(companiesList);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId, userName) => {
        if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:3002/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert('User deleted successfully');
                fetchData(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const getCompanyName = (companyId) => {
        const company = companies.find(c => c.id === companyId);
        return company ? company.name : 'N/A';
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return 'bg-purple-100 text-purple-800';
            case 'COMPANY_ADMIN':
                return 'bg-blue-100 text-blue-800';
            case 'DRIVER':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Filter users
    const filteredUsers = users.filter(u => {
        if (filters.companyId && u.companyId !== filters.companyId) return false;
        if (filters.role && u.role !== filters.role) return false;
        if (filters.search) {
            const search = filters.search.toLowerCase();
            return u.name.toLowerCase().includes(search) ||
                u.personalId.toLowerCase().includes(search) ||
                (u.email && u.email.toLowerCase().includes(search));
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">👥 User Management</h1>
                            <p className="text-sm text-gray-600">Manage all platform users</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/super-admin"
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                ← Dashboard
                            </Link>
                            <Link
                                href="/super-admin/users/new"
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                            >
                                + Add User
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Name, ID, Email..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company
                            </label>
                            <select
                                value={filters.companyId}
                                onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Companies</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role
                            </label>
                            <select
                                value={filters.role}
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Roles</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                                <option value="COMPANY_ADMIN">Company Admin</option>
                                <option value="DRIVER">Driver</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ companyId: '', role: '', search: '' })}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                        <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-gray-900">
                            {users.filter(u => u.role === 'COMPANY_ADMIN').length}
                        </div>
                        <div className="text-sm text-gray-600">Company Admins</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-gray-900">
                            {users.filter(u => u.role === 'DRIVER').length}
                        </div>
                        <div className="text-sm text-gray-600">Drivers</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-gray-900">
                            {users.filter(u => u.isActive).length}
                        </div>
                        <div className="text-sm text-gray-600">Active Users</div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personal ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{u.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 font-mono">{u.personalId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{u.email || '-'}</div>
                                            <div className="text-sm text-gray-500">{u.phone || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {u.companyId ? getCompanyName(u.companyId) : 'Platform'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(u.role)}`}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {u._count?.assignedTasks || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {u.companyId && (
                                                    <Link
                                                        href={`/super-admin/companies/${u.companyId}`}
                                                        className="text-primary-600 hover:text-primary-800 text-sm"
                                                    >
                                                        View Company
                                                    </Link>
                                                )}
                                                {u.role !== 'SUPER_ADMIN' && (
                                                    <button
                                                        onClick={() => handleDelete(u.id, u.name)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No users found matching filters.</p>
                        </div>
                    )}
                </div>

                {/* Results count */}
                <div className="mt-4 text-sm text-gray-600">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>
        </div>
    );
}
