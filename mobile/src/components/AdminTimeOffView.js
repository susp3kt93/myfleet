import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { timeoffAPI } from '../services/api';
import TimeOffDialog from './TimeOffDialog';

export default function AdminTimeOffView({ onRefresh }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('PENDING');

    // Dialog State
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [saving, setSaving] = useState(false);

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

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Request',
            'Are you sure you want to delete this request? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await timeoffAPI.cancelRequest(id); // Using existing cancelRequest which maps to DELETE
                            loadRequests();
                            if (onRefresh) onRefresh();
                            Alert.alert('Success', 'Request deleted');
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Failed to delete request');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (request) => {
        setEditingRequest(request);
        setDialogVisible(true);
    };

    const handleSaveRequest = async (data) => {
        if (!editingRequest) return;

        try {
            setSaving(true);
            await timeoffAPI.updateRequestDetails(editingRequest.id, data);
            setDialogVisible(false);
            setEditingRequest(null);
            loadRequests();
            Alert.alert('Success', 'Request updated successfully');
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', 'Failed to update request');
        } finally {
            setSaving(false);
        }
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
                    <View style={{ alignItems: 'flex-end' }}>
                        <Chip
                            style={{ backgroundColor: getStatusColor(item.status), marginBottom: 4 }}
                            textStyle={{ color: 'white', fontSize: 11 }}
                        >
                            {item.status}
                        </Chip>
                        <View style={{ flexDirection: 'row' }}>
                            <IconButton
                                icon="pencil"
                                size={20}
                                onPress={() => handleEdit(item)}
                                iconColor="#666"
                            />
                            <IconButton
                                icon="delete"
                                size={20}
                                onPress={() => handleDelete(item.id)}
                                iconColor="#ef4444"
                            />
                        </View>
                    </View>
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

            <TimeOffDialog
                visible={dialogVisible}
                onDismiss={() => {
                    setDialogVisible(false);
                    setEditingRequest(null);
                }}
                onSave={handleSaveRequest}
                request={editingRequest}
                loading={saving}
            />
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
