'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BackButton } from '../../../components/Buttons';
import { useDispatch, useSelector } from 'react-redux';
import { loadStoredAuth } from '../../../lib/authSlice';
import api from '../../../lib/api';
import AdminLayout from '../../../components/AdminLayout';
import { PrimaryButton, SecondaryButton, SuccessButton, DangerButton } from '../../../components/Buttons';
import { useTranslation } from '../../../contexts/LanguageContext';

export default function TimeOffManagementPage() {
    const { t, locale } = useTranslation('admin');
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('PENDING');
    const [processingId, setProcessingId] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(null);
    const [driverStats, setDriverStats] = useState({ year: new Date().getFullYear(), drivers: [] });
    const [showDriverStats, setShowDriverStats] = useState(false);
    const [editModal, setEditModal] = useState(null);

    useEffect(() => {
        dispatch(loadStoredAuth());
    }, [dispatch]);

    // ... (useEffect for auth check - no change)

    // ... (useEffect for fetch - no change)

    // ... (fetchDriverStats - no change)

    // ... (fetchRequests - no change)

    const handleDelete = async (id) => {
        if (!window.confirm(t('timeoff.confirmDelete') || 'Are you sure you want to delete this request?')) return;

        try {
            setProcessingId(id);
            await api.delete(`/timeoff/${id}`);
            fetchRequests();
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('Failed to delete request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleEdit = (request) => {
        setEditModal({
            id: request.id,
            startDate: request.requestDate,
            endDate: request.endDate,
            reason: request.reason
        });
    };

    const handleSaveEdit = async () => {
        if (!editModal) return;

        try {
            setProcessingId(editModal.id);
            await api.put(`/timeoff/${editModal.id}/details`, {
                requestDate: editModal.startDate,
                endDate: editModal.endDate,
                reason: editModal.reason
            });
            setEditModal(null);
            fetchRequests();
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Failed to update request');
        } finally {
            setProcessingId(null);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user?.role !== 'COMPANY_ADMIN' && user?.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, user, router]);

    useEffect(() => {
        if (isAuthenticated && (user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN')) {
            fetchRequests();
            fetchDriverStats();
        }
    }, [isAuthenticated, user, filter]);

    const fetchDriverStats = async () => {
        try {
            const response = await api.get('/timeoff/driver-stats');
            setDriverStats(response.data);
        } catch (error) {
            console.error('Error fetching driver stats:', error);
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await api.get('/timeoff', { params });
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching time-off requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setProcessingId(id);
            await api.put(`/timeoff/${id}/approve`, { adminNotes });
            setAdminNotes('');
            setShowNotesModal(null);
            fetchRequests();
        } catch (error) {
            console.error('Error approving request:', error);
            alert(t('timeoff.errorApprove'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        try {
            setProcessingId(id);
            await api.put(`/timeoff/${id}/reject`, { adminNotes });
            setAdminNotes('');
            setShowNotesModal(null);
            fetchRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert(t('timeoff.errorReject'));
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-GB', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatShortDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Calculate number of days in a request
    const getDaysCount = (request) => {
        if (!request.endDate) return 1;
        const start = new Date(request.requestDate);
        const end = new Date(request.endDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    };

    // Format date range for display
    const getDateRangeDisplay = (request) => {
        if (!request.endDate) {
            return formatShortDate(request.requestDate);
        }
        return `${formatShortDate(request.requestDate)} → ${formatShortDate(request.endDate)}`;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">{t('timeoff.statusPending')}</span>;
            case 'APPROVED':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{t('timeoff.statusApproved')}</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">{t('timeoff.statusRejected')}</span>;
            default:
                return null;
        }
    };

    const pendingCount = requests.filter(r => r.status === 'PENDING').length;

    if (!isAuthenticated || (user?.role !== 'COMPANY_ADMIN' && user?.role !== 'SUPER_ADMIN')) {
        return null;
    }

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <BackButton href="/admin" label={t('timeoff.back')} />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            🏖️ {t('timeoff.title')}
                            {pendingCount > 0 && (
                                <span className="ml-2 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full font-semibold">
                                    {pendingCount}
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {t('timeoff.subtitle')}
                        </p>
                    </div>
                </div>
                <SecondaryButton onClick={() => setShowDriverStats(!showDriverStats)}>
                    {t('timeoff.statsButton')}
                </SecondaryButton>
            </div>
            {/* Driver Year Stats - Collapsible */}
            {showDriverStats && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        {t('timeoff.statsTitle', { year: driverStats.year })}
                    </h3>
                    {driverStats.drivers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">{t('timeoff.noStatsData')}</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {driverStats.drivers.map(driver => (
                                <div key={driver.userId} className="p-4 bg-gray-50 rounded-xl border-l-4 border-green-500">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                                            <span className="text-lg font-bold text-green-600">
                                                {driver.name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{driver.name}</p>
                                            <p className="text-xs text-gray-500">{driver.personalId}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-3">
                                        <div className="flex-1 text-center p-2 bg-green-100 rounded-lg">
                                            <p className="text-lg font-bold text-green-700">{driver.approvedDays}</p>
                                            <p className="text-xs text-green-600">{t('timeoff.approvedDays')}</p>
                                        </div>
                                        <div className="flex-1 text-center p-2 bg-yellow-100 rounded-lg">
                                            <p className="text-lg font-bold text-yellow-700">{driver.pendingDays}</p>
                                            <p className="text-xs text-yellow-600">{t('timeoff.pendingDays')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex border-b">
                    {[
                        { key: 'PENDING', label: t('timeoff.pending'), icon: '⏳' },
                        { key: 'APPROVED', label: t('timeoff.approved'), icon: '✅' },
                        { key: 'REJECTED', label: t('timeoff.rejected'), icon: '❌' },
                        { key: 'all', label: t('timeoff.all'), icon: '📋' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition ${filter === tab.key
                                ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('timeoff.loading')}</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-4xl mb-4">📭</p>
                    <p className="text-gray-500">{t('timeoff.noRequests')} {filter !== 'all' ? t('timeoff.inCategory') : ''}.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(request => {
                        const daysCount = getDaysCount(request);
                        return (
                            <div key={request.id} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                                            <span className="text-xl font-bold text-green-600">
                                                {request.user?.name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {request.user?.name}
                                                </h3>
                                                {/* Days Count Badge */}
                                                <span className={`px-3 py-1 text-sm font-bold rounded-full ${daysCount === 1
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {daysCount} {daysCount === 1 ? t('timeoff.day') : t('timeoff.days')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {request.user?.personalId}
                                            </p>

                                            {/* Date Range Display */}
                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2 text-gray-800">
                                                    <span className="text-lg">📅</span>
                                                    <span className="font-semibold">
                                                        {getDateRangeDisplay(request)}
                                                    </span>
                                                </div>
                                                {request.endDate && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {t('timeoff.period', { count: daysCount })}
                                                    </p>
                                                )}
                                            </div>

                                            {request.reason && (
                                                <p className="text-sm text-gray-600 mt-3">
                                                    <span className="font-medium">📝 {t('timeoff.reason')}</span> {request.reason}
                                                </p>
                                            )}
                                            {request.adminNotes && (
                                                <p className="text-sm text-gray-600 mt-2 italic bg-yellow-50 p-2 rounded">
                                                    <span className="font-medium">💬 {t('timeoff.adminNotes')}</span> {request.adminNotes}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-3">
                                                {t('timeoff.requestCreated')} {new Date(request.createdAt).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-GB')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end space-y-3">
                                        <div className="flex items-center space-x-2">
                                            {getStatusBadge(request.status)}

                                            <button
                                                onClick={() => handleEdit(request)}
                                                className="p-1 text-gray-500 hover:text-blue-600 transition"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(request.id)}
                                                className="p-1 text-gray-500 hover:text-red-600 transition"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>

                                        {request.status === 'PENDING' && (
                                            <div className="flex space-x-2 mt-3">
                                                <button
                                                    onClick={() => setShowNotesModal({ id: request.id, action: 'approve' })}
                                                    disabled={processingId === request.id}
                                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                                >
                                                    ✅ {t('timeoff.approve')}
                                                </button>
                                                <button
                                                    onClick={() => setShowNotesModal({ id: request.id, action: 'reject' })}
                                                    disabled={processingId === request.id}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                                >
                                                    ❌ {t('timeoff.reject')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Admin Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">
                            {showNotesModal.action === 'approve' ? ('✅ ' + t('timeoff.approveRequest')) : ('❌ ' + t('timeoff.rejectRequest'))}
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('timeoff.notesOptional')}
                            </label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder={t('timeoff.notesPlaceholder')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowNotesModal(null);
                                    setAdminNotes('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                            >
                                {t('timeoff.cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    if (showNotesModal.action === 'approve') {
                                        handleApprove(showNotesModal.id);
                                    } else {
                                        handleReject(showNotesModal.id);
                                    }
                                }}
                                disabled={processingId !== null}
                                className={`px-4 py-2 text-white rounded-lg transition disabled:opacity-50 ${showNotesModal.action === 'approve'
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'bg-red-500 hover:bg-red-600'
                                    }`}
                            >
                                {processingId !== null ? t('timeoff.processing') : t('timeoff.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Edit Request Modal */}
            {
                editModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-bold mb-4">✏️ {t('timeoff.editRequest') || 'Edit Request'}</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={editModal.startDate ? new Date(editModal.startDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEditModal({ ...editModal, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={editModal.endDate ? new Date(editModal.endDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEditModal({ ...editModal, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                    <textarea
                                        value={editModal.reason || ''}
                                        onChange={(e) => setEditModal({ ...editModal, reason: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setEditModal(null)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                                >
                                    {t('timeoff.cancel')}
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={processingId !== null}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {processingId !== null ? t('timeoff.processing') : t('timeoff.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </AdminLayout >
    );
}
