'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import UnifiedBackButton from '../../../../components/UnifiedBackButton';

export default function NewUserPage() {
    const router = useRouter();
    const { user, token } = useSelector((state) => state.auth);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        personalId: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'DRIVER',
        companyId: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'SUPER_ADMIN') {
            router.push('/');
            return;
        }
        fetchCompanies();
    }, [user, router]);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('http://localhost:3002/api/companies', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            const companiesList = Array.isArray(data) ? data : (data.companies || []);
            setCompanies(companiesList);
        } catch (error) {
            console.error('Error fetching companies:', error);
            setError('Failed to load companies');
        }
    };

    const generatePersonalId = () => {
        const role = formData.role === 'COMPANY_ADMIN' ? 'ADMIN' : 'DRV';
        const company = companies.find(c => c.id === formData.companyId);
        const companyCode = company ? company.name.split(' ')[0].substring(0, 2).toUpperCase() : 'XX';
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${role}-${companyCode}-${random}`;
    };

    const handleGenerateId = () => {
        if (!formData.companyId) {
            setError('Please select a company first');
            return;
        }
        setFormData({ ...formData, personalId: generatePersonalId() });
    };

    const handleGeneratePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, password });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Validation
            if (!formData.personalId || !formData.name || !formData.password || !formData.companyId) {
                throw new Error('Please fill in all required fields');
            }

            const res = await fetch('http://localhost:3002/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            setSuccess(`User ${data.user.name} created successfully!`);

            // Reset form
            setTimeout(() => {
                router.push('/super-admin/users');
            }, 1500);

        } catch (error) {
            console.error('Error creating user:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-gray-900 to-indigo-900 shadow-lg text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <UnifiedBackButton href="/super-admin/users" label="Back to Users" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Add New User</h1>
                                <p className="text-sm text-indigo-200">Create a new Company Admin or Driver</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 text-sm">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Company Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="companyId"
                                value={formData.companyId}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Select Company</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name} ({company.plan})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="DRIVER">Driver</option>
                                <option value="COMPANY_ADMIN">Company Admin</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                Company Admin can manage users and tasks. Driver can only view assigned tasks.
                            </p>
                        </div>

                        {/* Personal ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Personal ID <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="personalId"
                                    value={formData.personalId}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., DRV-TE-001 or ADMIN-LP-001"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateId}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Generate
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Unique identifier for login</p>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Ion Popescu"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="user@example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+40721234567"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter password"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Generate
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Minimum 6 characters. User can change it later.</p>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                            >
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                            <Link
                                href="/super-admin/users"
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-center"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
