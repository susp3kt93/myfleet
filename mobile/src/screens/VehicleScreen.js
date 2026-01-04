import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TextInput, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function VehicleScreen({ navigation }) {
    const { t } = useTranslation();
    const { user } = useSelector((state) => state.auth);
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newMileage, setNewMileage] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadVehicle();
    }, []);

    const loadVehicle = async () => {
        try {
            const res = await api.get('/vehicles/my');
            setVehicle(res.data);
            if (res.data) {
                setNewMileage(res.data.currentMileage?.toString() || '');
            }
        } catch (error) {
            console.error('Error loading vehicle:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadVehicle();
        setRefreshing(false);
    };

    const handleUpdateMileage = async () => {
        if (!newMileage || parseInt(newMileage) < vehicle.currentMileage) {
            Alert.alert('Error', 'Mileage must be greater than current reading');
            return;
        }

        setUpdating(true);
        try {
            const res = await api.put(`/vehicles/${vehicle.id}/mileage`, {
                mileage: parseInt(newMileage)
            });
            setVehicle(res.data);
            Alert.alert('Success', 'Mileage updated successfully!');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to update mileage');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACTIVE':
                return { backgroundColor: '#D1FAE5', color: '#065F46' };
            case 'NEEDS_SERVICE':
                return { backgroundColor: '#FEE2E2', color: '#991B1B' };
            case 'IN_SERVICE':
                return { backgroundColor: '#FEF3C7', color: '#92400E' };
            default:
                return { backgroundColor: '#F3F4F6', color: '#374151' };
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ACTIVE': return '✅ Active';
            case 'NEEDS_SERVICE': return '⚠️ Needs Service';
            case 'IN_SERVICE': return '🔧 In Service';
            default: return status;
        }
    };

    const getMilesRemaining = () => {
        if (!vehicle?.nextServiceMileage) return null;
        return vehicle.nextServiceMileage - vehicle.currentMileage;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🚗 My Vehicle</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {vehicle ? (
                    <>
                        {/* Vehicle Info Card */}
                        <Card style={styles.card}>
                            <Card.Content>
                                <View style={styles.vehicleHeader}>
                                    <View>
                                        <Text style={styles.plateNumber}>{vehicle.plate}</Text>
                                        <Text style={styles.vehicleModel}>
                                            {vehicle.make} {vehicle.model} {vehicle.year}
                                        </Text>
                                        <Text style={styles.vehicleType}>
                                            {vehicle.type} {vehicle.color && `• ${vehicle.color}`}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(vehicle.status).backgroundColor }]}>
                                        <Text style={[styles.statusText, { color: getStatusStyle(vehicle.status).color }]}>
                                            {getStatusLabel(vehicle.status)}
                                        </Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>

                        {/* Mileage Card */}
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text style={styles.sectionTitle}>📊 Mileage Information</Text>

                                <View style={styles.mileageRow}>
                                    <View style={styles.mileageItem}>
                                        <Text style={styles.mileageLabel}>Current</Text>
                                        <Text style={styles.mileageValue}>
                                            {vehicle.currentMileage?.toLocaleString()} {vehicle.mileageUnit}
                                        </Text>
                                    </View>
                                    <View style={styles.mileageItem}>
                                        <Text style={styles.mileageLabel}>Next Service</Text>
                                        <Text style={styles.mileageValue}>
                                            {vehicle.nextServiceMileage?.toLocaleString()} {vehicle.mileageUnit}
                                        </Text>
                                    </View>
                                </View>

                                {getMilesRemaining() !== null && (
                                    <View style={[
                                        styles.warningBox,
                                        getMilesRemaining() <= 300 && styles.warningBoxDanger
                                    ]}>
                                        <Text style={[
                                            styles.warningText,
                                            getMilesRemaining() <= 300 && styles.warningTextDanger
                                        ]}>
                                            {getMilesRemaining() <= 0
                                                ? '⚠️ Service overdue!'
                                                : getMilesRemaining() <= 300
                                                    ? `⚠️ Only ${getMilesRemaining()} ${vehicle.mileageUnit} until service!`
                                                    : `✓ ${getMilesRemaining()} ${vehicle.mileageUnit} until service`
                                            }
                                        </Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>

                        {/* Update Mileage Card */}
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text style={styles.sectionTitle}>📝 Update Mileage</Text>
                                <Text style={styles.updateHint}>
                                    Enter your current odometer reading
                                </Text>

                                <View style={styles.updateRow}>
                                    <TextInput
                                        style={styles.mileageInput}
                                        value={newMileage}
                                        onChangeText={setNewMileage}
                                        keyboardType="numeric"
                                        placeholder={vehicle.currentMileage?.toString()}
                                    />
                                    <Button
                                        mode="contained"
                                        onPress={handleUpdateMileage}
                                        loading={updating}
                                        disabled={updating || !newMileage}
                                        style={styles.updateButton}
                                    >
                                        Update
                                    </Button>
                                </View>
                            </Card.Content>
                        </Card>

                        {/* Additional Info */}
                        {(vehicle.motExpiry || vehicle.insuranceExpiry || vehicle.taxExpiry) && (
                            <Card style={styles.card}>
                                <Card.Content>
                                    <Text style={styles.sectionTitle}>📋 Important Dates</Text>

                                    {vehicle.motExpiry && (
                                        <View style={styles.dateRow}>
                                            <Text style={styles.dateLabel}>MOT Expiry</Text>
                                            <Text style={styles.dateValue}>
                                                {new Date(vehicle.motExpiry).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    )}
                                    {vehicle.insuranceExpiry && (
                                        <View style={styles.dateRow}>
                                            <Text style={styles.dateLabel}>Insurance Expiry</Text>
                                            <Text style={styles.dateValue}>
                                                {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    )}
                                    {vehicle.taxExpiry && (
                                        <View style={styles.dateRow}>
                                            <Text style={styles.dateLabel}>Tax Expiry</Text>
                                            <Text style={styles.dateValue}>
                                                {new Date(vehicle.taxExpiry).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    )}
                                </Card.Content>
                            </Card>
                        )}
                    </>
                ) : (
                    <Card style={styles.card}>
                        <Card.Content style={styles.noVehicle}>
                            <Text style={styles.noVehicleIcon}>🚗</Text>
                            <Text style={styles.noVehicleTitle}>No Vehicle Assigned</Text>
                            <Text style={styles.noVehicleText}>
                                Your admin will assign a vehicle to you when available.
                            </Text>
                        </Card.Content>
                    </Card>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 50,
        backgroundColor: '#10b981', // emerald-500
    },
    backButton: {
        width: 60,
    },
    backText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
        borderRadius: 16,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e',
    },
    vehicleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    plateNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    vehicleModel: {
        fontSize: 16,
        color: '#4B5563',
        marginTop: 4,
    },
    vehicleType: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    mileageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    mileageItem: {
        flex: 1,
    },
    mileageLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    mileageValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 4,
    },
    warningBox: {
        backgroundColor: '#D1FAE5',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    warningBoxDanger: {
        backgroundColor: '#FEE2E2',
    },
    warningText: {
        color: '#065F46',
        textAlign: 'center',
        fontWeight: '500',
    },
    warningTextDanger: {
        color: '#991B1B',
    },
    updateHint: {
        color: '#6B7280',
        marginBottom: 12,
    },
    updateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    mileageInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 18,
    },
    updateButton: {
        backgroundColor: '#16a34a',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    dateLabel: {
        color: '#6B7280',
    },
    dateValue: {
        fontWeight: '600',
        color: '#111827',
    },
    noVehicle: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    noVehicleIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    noVehicleTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    noVehicleText: {
        color: '#6B7280',
        textAlign: 'center',
    },
});
