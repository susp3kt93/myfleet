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
            {/* Header with Deep Space Gradient */}
            <header className="bg-gradient-to-r from-gray-900 to-indigo-900 shadow-lg text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                                <span className="text-3xl">👑</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
                                <p className="text-sm text-indigo-200">Platform Management & Oversight</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/super-admin/users"
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-lg transition font-medium border border-white/10"
                            >
                                Manage Users
                            </Link>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-indigo-300">Root Access</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition font-medium backdrop-blur shadow-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Platform Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Companies Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-600 hover:shadow-xl transition transform hover:scale-[1.02] cursor-default">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Companies</p>
                                <div className="flex items-baseline mt-1">
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
                                    <span className="ml-2 text-sm font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                        {stats.activeCompanies} Active
                                    </span>
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-3xl">🏢</div>
                        </div>
                    </div>

                    {/* Users Card */}
                    <Link href="/super-admin/users" className="block transform hover:scale-[1.02] transition duration-200">
                        <div className="bg-white rounded-2xl shadow-lg p-6 h-full border-l-4 border-violet-500 cursor-pointer hover:shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
                                </div>
                                <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center text-3xl">👥</div>
                            </div>
                        </div>
                    </Link>

                    {/* Tasks Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-fuchsia-500 hover:shadow-xl transition transform hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Platform Tasks</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTasks}</p>
                            </div>
                            <div className="w-14 h-14 bg-fuchsia-100 rounded-xl flex items-center justify-center text-3xl">📋</div>
                        </div>
                    </div>

                    {/* Vehicles Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-cyan-500 hover:shadow-xl transition transform hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Vehicles</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalVehicles}</p>
                            </div>
                            <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center text-3xl">🚗</div>
                        </div>
                    </div>
                </div>

                {/* Quick Tools Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">Platform Tools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/super-admin/barcode-generator" className="block transform hover:scale-[1.02] transition duration-200">
                            <div className="bg-white rounded-2xl shadow-lg p-6 h-full border-l-4 border-amber-500 cursor-pointer hover:shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Barcode Generator</p>
                                        <p className="text-lg font-bold text-gray-900 mt-1">Create Labels</p>
                                        <p className="text-xs text-gray-500 mt-2">Generate barcodes & QR codes</p>
                                    </div>
                                    <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center text-3xl">🏷️</div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Companies Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Registered Companies</h2>
                            <p className="text-sm text-gray-500 mt-1">Manage tenant access and subscriptions</p>
                        </div>
                        <Link
                            href="/super-admin/companies/new"
                            className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                        >
                            <span className="mr-2 text-xl">+</span> Add Company
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-4 text-left">Company</th>
                                    <th className="px-6 py-4 text-left">Contact Info</th>
                                    <th className="px-6 py-4 text-center">Plan</th>
                                    <th className="px-6 py-4 text-center">Usage (Users/Cars)</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-indigo-50/30 transition duration-150 group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-100/50 flex items-center justify-center text-lg font-bold text-indigo-700 mr-3">
                                                    {company.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{company.name}</div>
                                                    <div className="text-xs text-mono text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-0.5">{company.taxId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 font-medium">{company.email}</div>
                                            <div className="text-sm text-gray-500">{company.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${company.plan === 'PREMIUM' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                company.plan === 'BASIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {company.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-4">
                                                <div className="text-center" title="Drivers">
                                                    <span className="text-xs text-gray-400 block">USERS</span>
                                                    <span className="font-bold text-gray-700">{company._count?.users || 0}</span>
                                                    <span className="text-xs text-gray-400">/{company.maxDrivers}</span>
                                                </div>
                                                <div className="w-px h-8 bg-gray-200"></div>
                                                <div className="text-center" title="Vehicles">
                                                    <span className="text-xs text-gray-400 block">CARS</span>
                                                    <span className="font-bold text-gray-700">{company._count?.vehicles || 0}</span>
                                                    <span className="text-xs text-gray-400">/{company.maxVehicles}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full mr-1.5 ${company.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {company.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/super-admin/companies/${company.id}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition"
                                                title="View Details"
                                            >
                                                →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {companies.length === 0 && (
                        <div className="text-center py-20 bg-gray-50">
                            <div className="text-5xl mb-4">🏢</div>
                            <h3 className="text-lg font-medium text-gray-900">No companies found</h3>
                            <p className="text-gray-500 mb-6">Get started by creating the first tenant.</p>
                            <Link
                                href="/super-admin/companies/new"
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                Create Company
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
