'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import UnifiedBackButton from '../../../../components/UnifiedBackButton';

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
            {/* Header with Deep Space Gradient */}
            <header className="bg-gradient-to-r from-gray-900 to-indigo-900 shadow-lg text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <UnifiedBackButton href="/super-admin" label="Back" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">User Management</h1>
                                <p className="text-sm text-indigo-200">System-wide user control</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/super-admin/users/new"
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition font-medium shadow-lg hover:shadow-indigo-500/25 border border-indigo-400"
                            >
                                + Add User
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Name, ID, Email..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Company
                            </label>
                            <select
                                value={filters.companyId}
                                onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
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
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Role
                            </label>
                            <select
                                value={filters.role}
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
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
                                className="w-full px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl">👥</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Admins</p>
                            <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'COMPANY_ADMIN').length}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">👔</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Drivers</p>
                            <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'DRIVER').length}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">🚛</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Active</p>
                            <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.isActive).length}</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">⚡</div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left">User</th>
                                    <th className="px-6 py-4 text-left">Personal ID</th>
                                    <th className="px-6 py-4 text-left">Contact</th>
                                    <th className="px-6 py-4 text-left">Company</th>
                                    <th className="px-6 py-4 text-left">Role</th>
                                    <th className="px-6 py-4 text-left">Tasks</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-indigo-50/30 transition duration-150">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{u.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit">{u.personalId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{u.email || '-'}</div>
                                            <div className="text-sm text-gray-500">{u.phone || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {u.companyId ? getCompanyName(u.companyId) : <span className="text-gray-400 italic">Platform</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${getRoleBadgeColor(u.role)}`}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 pl-8">
                                            {u._count?.assignedTasks || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                {u.companyId && (
                                                    <Link
                                                        href={`/super-admin/companies/${u.companyId}`}
                                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                                                    >
                                                        Company
                                                    </Link>
                                                )}
                                                {u.role !== 'SUPER_ADMIN' && (
                                                    <button
                                                        onClick={() => handleDelete(u.id, u.name)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition"
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
                        <div className="text-center py-12 bg-gray-50/50">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-gray-500 font-medium">No users found matching filters.</p>
                        </div>
                    )}
                </div>

                {/* Results count */}
                <div className="mt-4 text-sm text-gray-500 flex justify-between items-center px-2">
                    <span>Showing {filteredUsers.length} of {users.length} users</span>
                </div>
            </div>
        </div>
    );
}
