import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Badge } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { timeoffAPI } from '../services/api';

export default function AdminTimeOffView({ onRefresh }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('PENDING');

    useEffect(() => {
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await timeoffAPI.getRequests({ status: filter });
            setRequests(response.data || []);
        } catch (error) {
            console.error('Error loading time-off requests:', error);
            Alert.alert('Error', 'Failed to load time-off requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        Alert.alert(
            'Approve Request',
            'Are you sure you want to approve this time-off request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await timeoffAPI.approveRequest(id);
                            loadRequests();
                            if (onRefresh) onRefresh();
                            Alert.alert('Success', 'Request approved!');
                        } catch (error) {
                            console.error('Approve error:', error);
                            Alert.alert('Error', 'Failed to approve request');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (id) => {
        Alert.alert(
            'Reject Request',
            'Are you sure you want to reject this time-off request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await timeoffAPI.rejectRequest(id);
                            loadRequests();
                            if (onRefresh) onRefresh();
                            Alert.alert('Success', 'Request rejected');
                        } catch (error) {
                            console.error('Reject error:', error);
                            Alert.alert('Error', 'Failed to reject request');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#22c55e';
            case 'REJECTED': return '#ef4444';
            default: return '#f59e0b';
        }
    };

    const renderRequest = ({ item }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text variant="titleMedium" style={styles.driverName}>
                            {item.driver_name || item.user?.name || 'Unknown'}
                        </Text>
                        <Text variant="bodySmall" style={styles.date}>
                            {format(new Date(item.requestDate), 'dd MMM yyyy')}
                            {item.endDate && item.endDate !== item.requestDate &&
                                ` - ${format(new Date(item.endDate), 'dd MMM yyyy')}`
                            }
                        </Text>
                    </View>
                    <Chip
                        style={{ backgroundColor: getStatusColor(item.status) }}
                        textStyle={{ color: 'white', fontSize: 11 }}
                    >
                        {item.status}
                    </Chip>
                </View>

                {item.reason && (
                    <Text variant="bodyMedium" style={styles.reason}>
                        {item.reason}
                    </Text>
                )}

                {item.status === 'PENDING' && (
                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            buttonColor="#22c55e"
                            onPress={() => handleApprove(item.id)}
                            style={{ flex: 1, marginRight: 8 }}
                        >
                            Approve
                        </Button>
                        <Button
                            mode="outlined"
                            textColor="#ef4444"
                            onPress={() => handleReject(item.id)}
                            style={{ flex: 1 }}
                        >
                            Reject
                        </Button>
                    </View>
                )}
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            {/* Filter Chips */}
            <View style={styles.filterRow}>
                <Chip
                    selected={filter === 'PENDING'}
                    onPress={() => setFilter('PENDING')}
                    style={styles.filterChip}
                >
                    Pending
                </Chip>
                <Chip
                    selected={filter === 'APPROVED'}
                    onPress={() => setFilter('APPROVED')}
                    style={styles.filterChip}
                >
                    Approved
                </Chip>
                <Chip
                    selected={filter === 'REJECTED'}
                    onPress={() => setFilter('REJECTED')}
                    style={styles.filterChip}
                >
                    Rejected
                </Chip>
            </View>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#22c55e" />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    style={{ flex: 1 }}
                    ListEmptyComponent={
                        <Text style={styles.empty}>
                            No {filter.toLowerCase()} requests
                        </Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    filterRow: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
        backgroundColor: 'white',
    },
    filterChip: {
        marginRight: 8,
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
    driverName: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    date: {
        color: '#666',
    },
    reason: {
        marginTop: 8,
        color: '#444',
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        marginTop: 12,
    },
    empty: {
        textAlign: 'center',
        marginTop: 32,
        color: '#999',
        fontSize: 16,
    },
});
