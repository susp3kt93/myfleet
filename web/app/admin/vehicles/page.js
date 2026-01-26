'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '../../../lib/api';
import AdminLayout from '../../../components/AdminLayout';
import { PrimaryButton, SecondaryButton, SmallPrimaryButton, SmallSecondaryButton, IconButton } from '../../../components/Buttons';
import UnifiedBackButton from '../../../components/UnifiedBackButton';
import { format } from 'date-fns';

export default function VehiclesPage() {
    const { t } = useTranslation('admin');
    const router = useRouter();
    const { user, isAuthenticated } = useSelector(state => state.auth);

    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'assign', 'mileage', 'status'
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        type: 'Van',
        plate: '',
        make: '',
        model: '',
        year: '',
        capacity: '',
        color: '',
        currentMileage: 0,
        mileageUnit: 'miles',
        serviceIntervalMiles: 5000,
        insuranceExpiry: '',
        motExpiry: '',
        taxExpiry: ''
    });

    const [assignDriverId, setAssignDriverId] = useState('');
    const [newMileage, setNewMileage] = useState('');
    const [newStatus, setNewStatus] = useState('ACTIVE');
    const [serviceNotes, setServiceNotes] = useState('');
    const [unassignDriver, setUnassignDriver] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user?.role === 'DRIVER') {
            router.push('/dashboard');
        } else {
            loadData();
        }
    }, [isAuthenticated, user, router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [vehiclesRes, driversRes] = await Promise.all([
                api.get('/vehicles'),
                api.get('/users')
            ]);
            setVehicles(vehiclesRes.data);
            // API returns { users: [...] }, filter to drivers only
            const allUsers = driversRes.data.users || driversRes.data || [];
            setDrivers(allUsers.filter(u => u.role === 'DRIVER'));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVehicle = () => {
        setModalMode('add');
        setFormData({
            type: 'Van',
            plate: '',
            make: '',
            model: '',
            year: '',
            capacity: '',
            color: '',
            currentMileage: 0,
            mileageUnit: 'miles',
            serviceIntervalMiles: 5000,
            insuranceExpiry: '',
            motExpiry: '',
            taxExpiry: ''
        });
        setShowModal(true);
    };

    const handleEditVehicle = (vehicle) => {
        setModalMode('edit');
        setSelectedVehicle(vehicle);
        setFormData({
            type: vehicle.type,
            plate: vehicle.plate,
            make: vehicle.make || '',
            model: vehicle.model,
            year: vehicle.year || '',
            capacity: vehicle.capacity || '',
            color: vehicle.color || '',
            currentMileage: vehicle.currentMileage,
            mileageUnit: vehicle.mileageUnit,
            serviceIntervalMiles: vehicle.serviceIntervalMiles,
            insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split('T')[0] : '',
            motExpiry: vehicle.motExpiry ? vehicle.motExpiry.split('T')[0] : '',
            taxExpiry: vehicle.taxExpiry ? vehicle.taxExpiry.split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleAssign = (vehicle) => {
        setModalMode('assign');
        setSelectedVehicle(vehicle);
        setAssignDriverId('');
        setShowModal(true);
    };

    const handleMileage = (vehicle) => {
        setModalMode('mileage');
        setSelectedVehicle(vehicle);
        setNewMileage(vehicle.currentMileage.toString());
        setShowModal(true);
    };

    const handleStatus = (vehicle) => {
        setModalMode('status');
        setSelectedVehicle(vehicle);
        setNewStatus(vehicle.status);
        setServiceNotes(vehicle.serviceNotes || '');
        setUnassignDriver(true);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            if (modalMode === 'add') {
                await api.post('/vehicles', formData);
            } else if (modalMode === 'edit') {
                await api.put(`/vehicles/${selectedVehicle.id}`, formData);
            } else if (modalMode === 'assign') {
                if (assignDriverId) {
                    await api.put(`/vehicles/${selectedVehicle.id}/assign`, { driverId: assignDriverId });
                } else {
                    await api.put(`/vehicles/${selectedVehicle.id}/unassign`);
                }
            } else if (modalMode === 'mileage') {
                await api.put(`/vehicles/${selectedVehicle.id}/mileage`, { mileage: parseInt(newMileage) });
            } else if (modalMode === 'status') {
                await api.put(`/vehicles/${selectedVehicle.id}/status`, { status: newStatus, serviceNotes, unassignDriver });
            }

            setShowModal(false);
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (vehicle) => {
        if (!confirm(`Delete vehicle ${vehicle.plate}?`)) return;
        try {
            await api.delete(`/vehicles/${vehicle.id}`);
            loadData();
        } catch (error) {
            alert('Failed to delete vehicle');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'ACTIVE': 'bg-green-100 text-green-800',
            'IN_SERVICE': 'bg-yellow-100 text-yellow-800',
            'NEEDS_SERVICE': 'bg-red-100 text-red-800',
            'INACTIVE': 'bg-gray-100 text-gray-800'
        };
        const labels = {
            'ACTIVE': '✅ Active',
            'IN_SERVICE': '🔧 In Service',
            'NEEDS_SERVICE': '⚠️ Needs Service',
            'INACTIVE': '⏸️ Inactive'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getMileageWarning = (vehicle) => {
        if (!vehicle.nextServiceMileage) return null;
        const remaining = vehicle.nextServiceMileage - vehicle.currentMileage;
        if (remaining <= 0) {
            return <span className="text-red-600 text-sm font-medium">⚠️ Service overdue!</span>;
        } else if (remaining <= 300) {
            return <span className="text-orange-500 text-sm">{remaining} {vehicle.mileageUnit} until service</span>;
        }
        return null;
    };

    const availableDrivers = drivers.filter(d =>
        !vehicles.some(v => v.assignedToId === d.id) ||
        (selectedVehicle && selectedVehicle.assignedToId === d.id)
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <UnifiedBackButton href="/admin" label="Back" />
                    <h1 className="text-3xl font-bold text-gray-900">🚗 Fleet Vehicles</h1>
                </div>
                <PrimaryButton onClick={handleAddVehicle}>
                    + Add Vehicle
                </PrimaryButton>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-lg p-4 border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-gray-900">{vehicles.length}</div>
                    <div className="text-sm text-gray-500">Total Vehicles</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-4 border-l-4 border-green-500">
                    <div className="text-2xl font-bold text-green-600">{vehicles.filter(v => v.status === 'ACTIVE').length}</div>
                    <div className="text-sm text-gray-500">Active</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-4 border-l-4 border-amber-500">
                    <div className="text-2xl font-bold text-amber-600">{vehicles.filter(v => v.status === 'IN_SERVICE').length}</div>
                    <div className="text-sm text-gray-500">In Service</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-4 border-l-4 border-red-500">
                    <div className="text-2xl font-bold text-red-600">{vehicles.filter(v => v.status === 'NEEDS_SERVICE').length}</div>
                    <div className="text-sm text-gray-500">Needs Service</div>
                </div>
            </div>

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map(vehicle => (
                    <div key={vehicle.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{vehicle.plate}</h3>
                                    <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model} {vehicle.year}</p>
                                </div>
                                {getStatusBadge(vehicle.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>🚐 {vehicle.type}</span>
                                {vehicle.color && <span>• {vehicle.color}</span>}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50">
                            {/* Driver */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-600">Driver:</span>
                                {vehicle.assignedTo ? (
                                    <span className="font-medium text-gray-900">{vehicle.assignedTo.name}</span>
                                ) : (
                                    <span className="text-gray-400 italic">Unassigned</span>
                                )}
                            </div>

                            {/* Mileage */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-600">Mileage:</span>
                                <div className="text-right">
                                    <span className="font-medium">{vehicle.currentMileage.toLocaleString()} {vehicle.mileageUnit}</span>
                                    {getMileageWarning(vehicle)}
                                </div>
                            </div>

                            {/* Next Service */}
                            {vehicle.nextServiceMileage && (
                                <div className="flex items-center justify-between mb-3 text-sm">
                                    <span className="text-gray-600">Next service:</span>
                                    <span>{vehicle.nextServiceMileage.toLocaleString()} {vehicle.mileageUnit}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-gray-100 flex flex-wrap gap-2">
                            <button
                                onClick={() => handleMileage(vehicle)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                                🔢 Mileage
                            </button>
                            <button
                                onClick={() => handleAssign(vehicle)}
                                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            >
                                👤 Assign
                            </button>
                            <button
                                onClick={() => handleStatus(vehicle)}
                                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                            >
                                🔧 Status
                            </button>
                            <button
                                onClick={() => handleEditVehicle(vehicle)}
                                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => handleDelete(vehicle)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {vehicles.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No vehicles yet.</p>
                    <p className="text-gray-400">Click "Add Vehicle" to add your first vehicle.</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">
                                {modalMode === 'add' && '🚗 Add New Vehicle'}
                                {modalMode === 'edit' && `✏️ Edit ${selectedVehicle?.plate}`}
                                {modalMode === 'assign' && `👤 Assign Driver - ${selectedVehicle?.plate}`}
                                {modalMode === 'mileage' && `🔢 Update Mileage - ${selectedVehicle?.plate}`}
                                {modalMode === 'status' && `🔧 Change Status - ${selectedVehicle?.plate}`}
                            </h2>
                        </div>

                        <div className="p-6">
                            {/* Add/Edit Form */}
                            {(modalMode === 'add' || modalMode === 'edit') && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                            >
                                                <option value="Van">Van</option>
                                                <option value="Truck">Truck</option>
                                                <option value="Car">Car</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Plate *</label>
                                            <input
                                                type="text"
                                                value={formData.plate}
                                                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                                                className="w-full border rounded-lg px-3 py-2"
                                                placeholder="ABC 123"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                                            <input
                                                type="text"
                                                value={formData.make}
                                                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                                placeholder="Ford"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                                            <input
                                                type="text"
                                                value={formData.model}
                                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                                placeholder="Transit"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                            <input
                                                type="number"
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                                placeholder="2023"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                            <input
                                                type="text"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                                placeholder="White"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                            <input
                                                type="text"
                                                value={formData.capacity}
                                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                                placeholder="3.5t"
                                            />
                                        </div>
                                    </div>

                                    {modalMode === 'add' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Mileage</label>
                                                    <input
                                                        type="number"
                                                        value={formData.currentMileage}
                                                        onChange={(e) => setFormData({ ...formData, currentMileage: parseInt(e.target.value) || 0 })}
                                                        className="w-full border rounded-lg px-3 py-2"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                                    <select
                                                        value={formData.mileageUnit}
                                                        onChange={(e) => setFormData({ ...formData, mileageUnit: e.target.value })}
                                                        className="w-full border rounded-lg px-3 py-2"
                                                    >
                                                        <option value="miles">Miles</option>
                                                        <option value="km">Kilometers</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Interval ({formData.mileageUnit})</label>
                                                <input
                                                    type="number"
                                                    value={formData.serviceIntervalMiles}
                                                    onChange={(e) => setFormData({ ...formData, serviceIntervalMiles: parseInt(e.target.value) || 5000 })}
                                                    className="w-full border rounded-lg px-3 py-2"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">MOT Expiry</label>
                                            <input
                                                type="date"
                                                value={formData.motExpiry}
                                                onChange={(e) => setFormData({ ...formData, motExpiry: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
                                            <input
                                                type="date"
                                                value={formData.insuranceExpiry}
                                                onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Expiry</label>
                                            <input
                                                type="date"
                                                value={formData.taxExpiry}
                                                onChange={(e) => setFormData({ ...formData, taxExpiry: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Assign Form */}
                            {modalMode === 'assign' && (
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        {selectedVehicle?.assignedTo
                                            ? `Currently assigned to: ${selectedVehicle.assignedTo.name}`
                                            : 'Vehicle is not assigned to any driver.'
                                        }
                                    </p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
                                        <select
                                            value={assignDriverId}
                                            onChange={(e) => setAssignDriverId(e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2"
                                        >
                                            <option value="">-- Unassign Vehicle --</option>
                                            {availableDrivers.map(driver => (
                                                <option key={driver.id} value={driver.id}>
                                                    {driver.personalId} - {driver.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Mileage Form */}
                            {modalMode === 'mileage' && (
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        Current: <strong>{selectedVehicle?.currentMileage?.toLocaleString()} {selectedVehicle?.mileageUnit}</strong>
                                    </p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Mileage</label>
                                        <input
                                            type="number"
                                            value={newMileage}
                                            onChange={(e) => setNewMileage(e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2"
                                            min={selectedVehicle?.currentMileage}
                                        />
                                    </div>
                                    {selectedVehicle?.nextServiceMileage && (
                                        <p className="text-sm text-gray-500">
                                            Next service due at: {selectedVehicle.nextServiceMileage.toLocaleString()} {selectedVehicle.mileageUnit}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Status Form */}
                            {modalMode === 'status' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2"
                                        >
                                            <option value="ACTIVE">✅ Active</option>
                                            <option value="IN_SERVICE">🔧 In Service</option>
                                            <option value="NEEDS_SERVICE">⚠️ Needs Service</option>
                                            <option value="INACTIVE">⏸️ Inactive</option>
                                        </select>
                                    </div>

                                    {newStatus === 'IN_SERVICE' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Notes</label>
                                                <textarea
                                                    value={serviceNotes}
                                                    onChange={(e) => setServiceNotes(e.target.value)}
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    rows={3}
                                                    placeholder="Reason for service..."
                                                />
                                            </div>
                                            {selectedVehicle?.assignedTo && (
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={unassignDriver}
                                                        onChange={(e) => setUnassignDriver(e.target.checked)}
                                                    />
                                                    <span className="text-sm">Unassign from driver ({selectedVehicle.assignedTo.name})</span>
                                                </label>
                                            )}
                                        </>
                                    )}

                                    {selectedVehicle?.status === 'IN_SERVICE' && newStatus === 'ACTIVE' && (
                                        <p className="text-green-600 text-sm">
                                            ✅ Returning from service will reset the service interval.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
