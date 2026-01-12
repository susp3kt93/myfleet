import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, IconButton, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { deductionsAPI, usersAPI } from '../services/api'; // Added usersAPI
import DeductionDialog from './DeductionDialog'; // Added import

export default function AdminDeductionsView({ onRefresh }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [deductions, setDeductions] = useState([]);

    // Dialog State
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingDeduction, setEditingDeduction] = useState(null);
    const [drivers, setDrivers] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([loadDeductions(), loadDrivers()]);
        } finally {
            setLoading(false);
        }
    };

    const loadDeductions = async () => {
        try {
            const response = await deductionsAPI.getDeductions();
            setDeductions(response.data.deductions || []);
        } catch (error) {
            console.error('Error loading deductions:', error);
            // Alert.alert('Error', 'Failed to load deductions'); // Silenced to avoid spam if just one fails
        }
    };

    const loadDrivers = async () => {
        try {
            const response = await usersAPI.getUsers();
            const allUsers = response.data.users || [];
            // Filter only drivers
            setDrivers(allUsers.filter(u => u.role === 'DRIVER'));
        } catch (error) {
            console.error('Error loading drivers:', error);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Deduction',
            'Are you sure you want to delete this deduction?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deductionsAPI.deleteDeduction(id);
                            loadDeductions();
                            if (onRefresh) onRefresh();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete deduction');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item) => {
        setEditingDeduction(item);
        setDialogVisible(true);
    };

    const handleAdd = () => {
        setEditingDeduction(null);
        setDialogVisible(true);
    };

    const handleSubmit = async (data) => {
        try {
            if (editingDeduction) {
                await deductionsAPI.updateDeduction(editingDeduction.id, data);
            } else {
                await deductionsAPI.createDeduction(data);
            }
            setDialogVisible(false);
            loadDeductions();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save deduction');
        }
    };

    const getStatusColor = (status) => {
        return status === 'ACTIVE' ? '#22c55e' : '#9ca3af';
    };

    const renderItem = (item) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text variant="titleMedium" style={styles.description}>
                            {item.description}
                        </Text>
                        <Text variant="bodySmall" style={styles.user}>
                            {item.user?.name || 'Unknown Driver'}
                        </Text>
                        <Text variant="headlineSmall" style={styles.amount}>
                            £{item.amount}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            <Chip style={styles.typeChip} textStyle={{ fontSize: 10 }}>
                                {item.type}
                            </Chip>
                            <Chip style={styles.typeChip} textStyle={{ fontSize: 10 }}>
                                {item.frequency}
                            </Chip>
                            <Chip
                                style={{ backgroundColor: getStatusColor(item.status) }}
                                textStyle={{ fontSize: 10, color: 'white' }}
                            >
                                {item.status}
                            </Chip>
                        </View>
                        <Text variant="bodySmall" style={styles.date}>
                            Start: {format(new Date(item.startDate), 'dd MMM yyyy')}
                            {item.endDate && ` • End: ${format(new Date(item.endDate), 'dd MMM yyyy')}`}
                        </Text>
                    </View>
                    <View style={styles.actions}>
                        <IconButton
                            icon="pencil"
                            size={20}
                            iconColor="#666"
                            onPress={() => handleEdit(item)}
                        />
                        <IconButton
                            icon="delete"
                            size={20}
                            iconColor="#ef4444"
                            onPress={() => handleDelete(item.id)}
                        />
                    </View>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#22c55e" />
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.list}>
                        {deductions.length > 0 ? (
                            deductions.map((item) => (
                                <View key={item.id}>
                                    {renderItem(item)}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.empty}>No deductions found</Text>
                        )}
                    </ScrollView>

                    <FAB
                        icon="plus"
                        style={styles.fab}
                        onPress={handleAdd}
                        label="New Deduction"
                    />

                    <DeductionDialog
                        visible={dialogVisible}
                        onDismiss={() => setDialogVisible(false)}
                        onSubmit={handleSubmit}
                        deduction={editingDeduction}
                        drivers={drivers}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, // Changed to row/flex-start
    list: { padding: 16, paddingBottom: 80 }, // Added paddingBottom for FAB
    card: { marginBottom: 12, backgroundColor: 'white' },
    description: { fontWeight: 'bold', marginBottom: 4 },
    user: { marginBottom: 4, fontStyle: 'italic', color: '#666' },
    amount: { fontWeight: 'bold', color: '#ef4444' },
    typeChip: { alignSelf: 'flex-start' },
    date: { color: '#666', fontSize: 13, marginTop: 8 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { textAlign: 'center', marginTop: 32, color: '#999', fontSize: 16 },
    actions: { flexDirection: 'column', alignItems: 'center' }, // Changed to column for vertical buttons
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#22c55e',
    },
});
