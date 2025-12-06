import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { acceptTask, rejectTask } from '../store/tasksSlice';
import { format } from 'date-fns';

export default function TaskCard({ task }) {
    const dispatch = useDispatch();

    const handleAccept = () => {
        dispatch(acceptTask(task.id));
    };

    const handleReject = () => {
        dispatch(rejectTask(task.id));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACCEPTED':
                return '#10B981';
            case 'REJECTED':
                return '#EF4444';
            case 'IN_PROGRESS':
                return '#F59E0B';
            case 'COMPLETED':
                return '#6366F1';
            default:
                return '#6B7280';
        }
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <Text style={styles.title}>{task.title}</Text>
                    <Chip
                        style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) }]}
                        textStyle={styles.statusText}
                    >
                        {task.status}
                    </Chip>
                </View>

                {task.description && (
                    <Text style={styles.description}>{task.description}</Text>
                )}

                <View style={styles.details}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>📅 Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(task.scheduledDate)}</Text>
                    </View>

                    {task.scheduledTime && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>🕐 Time:</Text>
                            <Text style={styles.detailValue}>{task.scheduledTime}</Text>
                        </View>
                    )}

                    {task.location && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>📍 Location:</Text>
                            <Text style={styles.detailValue}>{task.location}</Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>💰 Price:</Text>
                        <Text style={styles.priceValue}>{Number(task.price).toFixed(2)} RON</Text>
                    </View>
                </View>

                {task.status === 'PENDING' && (
                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            onPress={handleAccept}
                            style={[styles.button, styles.acceptButton]}
                            contentStyle={styles.buttonContent}
                        >
                            Accept
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={handleReject}
                            style={[styles.button, styles.rejectButton]}
                            contentStyle={styles.buttonContent}
                            textColor="#EF4444"
                        >
                            Reject
                        </Button>
                    </View>
                )}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    statusChip: {
        height: 28,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    details: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 16,
        color: '#10B981',
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
    },
    buttonContent: {
        paddingVertical: 4,
    },
    acceptButton: {
        backgroundColor: '#10B981',
    },
    rejectButton: {
        borderColor: '#EF4444',
    },
});
