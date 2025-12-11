'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';

export default function NewCompanyPage() {
    const router = useRouter();
    const { user, token } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isReady, setIsReady] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        plan: 'FREE',
        maxDrivers: 5,
        maxVehicles: 5
    });

    // SSR-safe auth check - only runs on client
    useEffect(() => {
        if (!user || user.role !== 'SUPER_ADMIN') {
            router.push('/');
        } else {
            setIsReady(true);
        }
    }, [user, router]);

    // Show loading state until auth check completes
    if (!isReady) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3002/api/companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create company');
            }

            // Redirect to super admin dashboard
            router.push('/super-admin');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Add New Company</h1>
                            <p className="text-sm text-gray-600">Create a new company in the system</p>
                        </div>
                        <Link
                            href="/super-admin"
                            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition"
                        >
                            ← Back
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Company Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="e.g., Transport Express SRL"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="company@example.com"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="+373 XX XXX XXX"
                            />
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Street Address, City"
                            />
                        </div>

                        {/* Tax ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tax ID
                            </label>
                            <input
                                type="text"
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="1234567890"
                            />
                        </div>

                        {/* Plan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subscription Plan
                            </label>
                            <select
                                name="plan"
                                value={formData.plan}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="FREE">Free</option>
                                <option value="BASIC">Basic</option>
                                <option value="PREMIUM">Premium</option>
                            </select>
                        </div>

                        {/* Max Drivers */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Drivers
                            </label>
                            <input
                                type="number"
                                name="maxDrivers"
                                value={formData.maxDrivers}
                                onChange={handleChange}
                                min="1"
                                max="100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Max Vehicles */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Vehicles
                            </label>
                            <input
                                type="number"
                                name="maxVehicles"
                                value={formData.maxVehicles}
                                onChange={handleChange}
                                min="1"
                                max="100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                        <Link
                            href="/super-admin"
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition"
                        >
                            {loading ? 'Creating...' : 'Create Company'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
