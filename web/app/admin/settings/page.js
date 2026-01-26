'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { loadStoredAuth } from '../../../lib/authSlice';
import api from '../../../lib/api';
import AdminLayout from '../../../components/AdminLayout';
import { useTranslation } from '../../../contexts/LanguageContext';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import Link from 'next/link';
import UnifiedBackButton from '../../../components/UnifiedBackButton';

export default function AdminSettingsPage() {
    const { t } = useTranslation('admin');
    const { t: tCommon } = useTranslation('common');
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [company, setCompany] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        dispatch(loadStoredAuth());
    }, [dispatch]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user?.role !== 'ADMIN' && user?.role !== 'COMPANY_ADMIN') {
            router.push('/dashboard');
        } else if (user?.companyId) {
            fetchCompanyDetails();
        }
    }, [isAuthenticated, user]);

    const fetchCompanyDetails = async () => {
        try {
            const res = await api.get(`/companies/${user.companyId}`);
            setCompany(res.data);
            if (res.data.logo) {
                // Ensure absolute URL if needed, or relative to public
                const logoUrl = res.data.logo;
                setLogoPreview(logoUrl.startsWith('http') ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002'}${logoUrl}`);
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
            alert('Failed to load company details');
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview immediate
        const objectUrl = URL.createObjectURL(file);
        setLogoPreview(objectUrl);

        const formData = new FormData();
        formData.append('logo', file);

        setUploading(true);
        try {
            const res = await api.post(`/companies/${user.companyId}/logo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Logo uploaded:', res.data);
            alert('Logo updated successfully!');

            // Handle new logo URL immediately
            if (res.data.logoUrl) {
                const newLogoUrl = res.data.logoUrl;
                setLogoPreview(newLogoUrl.startsWith('http') ? newLogoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002'}${newLogoUrl}`);
            } else {
                fetchCompanyDetails(); // Fallback refresh
            }
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    if (!isAuthenticated || !company) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <UnifiedBackButton href="/admin" label="Back" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">⚙️ Company Settings</h1>
                        <p className="text-sm text-gray-500">Manage your company preferences and configuration</p>
                    </div>
                </div>
                <LanguageSwitcher />
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Company Branding</h2>
                    <p className="text-sm text-gray-500 mt-1">Update your company logo and details.</p>
                </div>

                <div className="p-8">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-full border-4 border-gray-100 shadow-inner overflow-hidden flex items-center justify-center bg-gray-50">
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Company Logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-4xl text-gray-300">🏢</div>
                                )}

                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>

                            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition transform hover:scale-105">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">Click the camera icon to upload a circular logo</p>
                    </div>

                    {/* Company Details (Read Only for now) */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input
                                type="text"
                                value={company.name}
                                readOnly
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={company.email}
                                readOnly
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                                type="text"
                                value={company.address || ''}
                                readOnly
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Code</label>
                            <input
                                type="text"
                                value={company.taxId || ''}
                                readOnly
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                        <div>
                            Plan: <span className="font-semibold text-gray-900">{company.plan}</span>
                        </div>
                        <div>
                            Created: {new Date(company.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </main>
        </div >
    );
}
