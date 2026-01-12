import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Portal, Modal, TextInput, IconButton, Menu } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { vehiclesAPI } from '../services/api';

export default function AdminVehiclesView({ drivers, onRefresh }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [mode, setMode] = useState('create'); // 'create' | 'edit'
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: '',
        plate: '',
        vin: '',
        currentMileage: '',
        mileageUnit: 'km',
        status: 'ACTIVE',
        assignedToId: ''
    });

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const response = await vehiclesAPI.getVehicles();
            setVehicles(response.data || []);
        } catch (error) {
            console.error('Error loading vehicles:', error);
            Alert.alert('Error', 'Failed to load vehicles');
        } finally {
            setLoading(false);
        }
    };

    const initCreate = () => {
        setMode('create');
        setFormData({
            make: '', model: '', year: '', plate: '', vin: '',
            currentMileage: '', mileageUnit: 'km', status: 'ACTIVE', assignedToId: ''
        });
        setModalVisible(true);
    };

    const initEdit = (vehicle) => {
        setMode('edit');
        setEditingId(vehicle.id);
        setFormData({
            make: vehicle.make || '',
            model: vehicle.model || '',
            year: String(vehicle.year || ''),
            plate: vehicle.plate || '',
            vin: vehicle.vin || '',
            currentMileage: String(vehicle.currentMileage || ''),
            mileageUnit: vehicle.mileageUnit || 'km',
            status: vehicle.status || 'ACTIVE',
            assignedToId: vehicle.assignedToId || ''
        });
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!formData.make || !formData.model || !formData.plate) {
            Alert.alert('Error', 'Make, Model, and Plate are required');
            return;
        }

        try {
            setSaving(true);
            const payload = { ...formData };
            if (payload.year) payload.year = parseInt(payload.year);
            if (payload.currentMileage) payload.currentMileage = parseFloat(payload.currentMileage);

            if (mode === 'create') {
                await vehiclesAPI.createVehicle(payload);
                Alert.alert('Success', 'Vehicle created');
            } else {
                await vehiclesAPI.updateVehicle(editingId, payload);
                Alert.alert('Success', 'Vehicle updated');
            }

            setModalVisible(false);
            loadVehicles();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Save vehicle error:', error);
            Alert.alert('Error', 'Failed to save vehicle');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Vehicle',
            'Are you sure? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await vehiclesAPI.deleteVehicle(id);
                            loadVehicles();
                            if (onRefresh) onRefresh();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete vehicle');
                        }
                    }
                }
            ]
        );
    };

    const renderVehicle = ({ item }) => {
        const assignedDriver = item.assignedTo || drivers.find(d => d.id === item.assignedToId);

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text variant="titleLarge" style={styles.plate}>
                                {item.plate || 'N/A'}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: '#666' }}>
                                {item.make} {item.model} ({item.year})
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            {item.status === 'MAINTENANCE' ? (
                                <Chip style={{ backgroundColor: '#ef4444' }} textStyle={{ color: 'white', fontSize: 10 }}>Maintenance</Chip>
                            ) : item.assignedToId ? (
                                <Chip style={{ backgroundColor: '#22c55e' }} textStyle={{ color: 'white', fontSize: 10 }}>Assigned</Chip>
                            ) : (
                                <Chip style={{ backgroundColor: '#f59e0b' }} textStyle={{ color: 'white', fontSize: 10 }}>Available</Chip>
                            )}
                        </View>
                    </View>

                    <View style={styles.info}>
                        <Text variant="bodyMedium">
                            Mileage: <Text style={{ fontWeight: 'bold' }}>{item.currentMileage || 0} {item.mileageUnit}</Text>
                        </Text>
                        <Text variant="bodyMedium">
                            Driver: <Text style={{ fontWeight: 'bold' }}>{assignedDriver ? assignedDriver.name : 'Unassigned'}</Text>
                        </Text>
                    </View>

                    <View style={styles.actions}>
                        <Button mode="outlined" compact onPress={() => initEdit(item)} style={{ marginRight: 8 }}>
                            Edit
                        </Button>
                        <Button mode="outlined" compact textColor="#ef4444" style={{ borderColor: '#ef4444' }} onPress={() => handleDelete(item.id)}>
                            Delete
                        </Button>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Button mode="contained" icon="plus" buttonColor="#22c55e" onPress={initCreate}>
                    Add Vehicle
                </Button>
            </View>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#22c55e" />
                </View>
            ) : (
                <FlatList
                    data={vehicles}
                    renderItem={renderVehicle}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    style={{ flex: 1 }}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No vehicles found</Text>
                    }
                />
            )}

            <Portal>
                <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
                    <ScrollView>
                        <Text style={styles.modalTitle}>
                            {mode === 'create' ? 'Add Vehicle' : 'Edit Vehicle'}
                        </Text>

                        <TextInput
                            label="Make"
                            value={formData.make}
                            onChangeText={txt => setFormData({ ...formData, make: txt })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Model"
                            value={formData.model}
                            onChangeText={txt => setFormData({ ...formData, model: txt })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Year"
                            value={formData.year}
                            onChangeText={txt => setFormData({ ...formData, year: txt })}
                            style={styles.input}
                            mode="outlined"
                            keyboardType="numeric"
                        />
                        <TextInput
                            label="Plate Number"
                            value={formData.plate}
                            onChangeText={txt => setFormData({ ...formData, plate: txt.toUpperCase() })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Current Mileage"
                            value={formData.currentMileage}
                            onChangeText={txt => setFormData({ ...formData, currentMileage: txt })}
                            style={styles.input}
                            mode="outlined"
                            keyboardType="numeric"
                        />
                        <TextInput
                            label="VIN (Optional)"
                            value={formData.vin}
                            onChangeText={txt => setFormData({ ...formData, vin: txt })}
                            style={styles.input}
                            mode="outlined"
                        />

                        <View style={styles.modalActions}>
                            <Button onPress={() => setModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
                            <Button mode="contained" onPress={handleSubmit} loading={saving} buttonColor="#22c55e">
                                Save
                            </Button>
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    topBar: {
        padding: 16,
        paddingBottom: 0,
        alignItems: 'flex-end',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    plate: {
        fontWeight: 'bold',
    },
    info: {
        marginTop: 8,
        gap: 4,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
    },
    empty: {
        textAlign: 'center',
        marginTop: 32,
        color: '#999',
        fontSize: 16,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
        maxHeight: '80%'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center'
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'white',
        height: 45
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16
    }
});
