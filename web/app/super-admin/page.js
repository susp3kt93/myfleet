'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';

export default function SuperAdminDashboard() {
    const router = useRouter();
    const { user, token } = useSelector((state) => state.auth);
    const [companies, setCompanies] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

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

            // Fetch companies
            const companiesRes = await fetch('http://localhost:3002/api/companies', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const companiesData = await companiesRes.json();
            console.log('[Super Admin] Raw API response:', companiesData);
            // Handle response - API returns array directly
            const companiesList = Array.isArray(companiesData) ? companiesData : (companiesData.companies || []);
            console.log('[Super Admin] Companies list:', companiesList);
            setCompanies(companiesList);

            // Calculate platform stats
            const totalUsers = companiesList.reduce((sum, c) => sum + (c._count?.users || 0), 0);
            const totalTasks = companiesList.reduce((sum, c) => sum + (c._count?.tasks || 0), 0);
            const totalVehicles = companiesList.reduce((sum, c) => sum + (c._count?.vehicles || 0), 0);

            console.log('[Super Admin] Calculated stats:', {
                totalCompanies: companiesList.length,
                totalUsers,
                totalTasks,
                totalVehicles
            });

            setStats({
                totalCompanies: companiesList.length,
                activeCompanies: companiesList.filter(c => c.isActive).length,
                totalUsers,
                totalTasks,
                totalVehicles
            });

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

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
                            <h1 className="text-2xl font-bold text-gray-900">👑 Super Admin Dashboard</h1>
                            <p className="text-sm text-gray-600">Platform Management</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/super-admin/users"
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                Users
                            </Link>
                            <span className="text-sm text-gray-600">{user?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Platform Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="text-3xl mb-2">🏢</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</div>
                        <div className="text-sm text-gray-600">Total Companies</div>
                        <div className="text-xs text-green-600 mt-1">{stats.activeCompanies} active</div>
                    </div>
                    <Link href="/super-admin/users" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition cursor-pointer">
                        <div className="text-3xl mb-2">👥</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                        <div className="text-sm text-gray-600">Total Users</div>
                    </Link>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="text-3xl mb-2">📋</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
                        <div className="text-sm text-gray-600">Total Tasks</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="text-3xl mb-2">🚗</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</div>
                        <div className="text-sm text-gray-600">Total Vehicles</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="text-3xl mb-2">💰</div>
                        <div className="text-2xl font-bold text-gray-900">Active</div>
                        <div className="text-sm text-gray-600">Platform Status</div>
                    </div>
                </div>

                {/* Companies List */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Companies</h2>
                            <Link
                                href="/super-admin/companies/new"
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                            >
                                + Add Company
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicles</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{company.name}</div>
                                            <div className="text-sm text-gray-500">{company.taxId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{company.email}</div>
                                            <div className="text-sm text-gray-500">{company.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${company.plan === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                                                company.plan === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {company.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {company._count?.users || 0} / {company.maxDrivers}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {company._count?.tasks || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {company._count?.vehicles || 0} / {company.maxVehicles}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {company.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/super-admin/companies/${company.id}`}
                                                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                                            >
                                                View Details →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {companies.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No companies yet. Create your first company!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
