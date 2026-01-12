import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { deductionsAPI } from '../services/api';

export default function AdminDeductionsView({ onRefresh }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [deductions, setDeductions] = useState([]);

    useEffect(() => {
        loadDeductions();
    }, []);

    const loadDeductions = async () => {
        try {
            setLoading(true);
            const response = await deductionsAPI.getDeductions();
            setDeductions(response.data.deductions || []);
        } catch (error) {
            console.error('Error loading deductions:', error);
            Alert.alert('Error', 'Failed to load deductions');
        } finally {
            setLoading(false);
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
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
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
                    <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#ef4444"
                        onPress={() => handleDelete(item.id)}
                    />
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
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, alignItems: 'flex-end', backgroundColor: 'white' },
    list: { padding: 16 },
    card: { marginBottom: 12, backgroundColor: 'white' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    type: { fontWeight: 'bold' },
    amount: { fontWeight: 'bold', color: '#ef4444' },
    date: { color: '#666', fontSize: 13, marginTop: 4 },
    reason: { color: '#444', fontSize: 14, marginTop: 4 },
    user: { marginTop: 8, fontStyle: 'italic', color: '#666' },
    modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    input: { marginBottom: 12, backgroundColor: 'white' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
    loading: { padding: 20, alignItems: 'center' },
    empty: { textAlign: 'center', marginTop: 32, color: '#999' },
    // Existing styles that were not part of the instruction's style block but are used in renderItem
    description: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    typeChip: {
        alignSelf: 'flex-start',
    },
    empty: {
        textAlign: 'center',
        marginTop: 32,
        color: '#999',
        fontSize: 16,
    },
});
