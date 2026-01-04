import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { acceptTask, rejectTask, completeTask, cancelTask, fetchTasks } from '../store/tasksSlice';

export default function TaskDetailsScreen({ route, navigation }) {
    const { task } = route.params;
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        try {
            setLoading(true);
            await dispatch(acceptTask(task.id)).unwrap();
            Alert.alert('Success', t('taskDetails.successAccepted'));
            dispatch(fetchTasks({})); // Refresh task list
            navigation.goBack();
        } catch (error) {
            Alert.alert(t('common.error'), error || t('taskDetails.errorAccept'));
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        Alert.alert(
            t('common.confirm'),
            t('taskDetails.confirmReject'),
            [
                { text: t('actions.cancel'), style: 'cancel' },
                {
                    text: t('actions.reject'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await dispatch(rejectTask(task.id)).unwrap();
                            Alert.alert('Success', t('taskDetails.successRejected'));
                            dispatch(fetchTasks({}));
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert(t('common.error'), error || t('taskDetails.errorReject'));
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleComplete = async () => {
        Alert.alert(
            t('common.confirm'),
            t('taskDetails.confirmComplete'),
            [
                { text: t('actions.cancel'), style: 'cancel' },
                {
                    text: t('actions.complete'),
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await dispatch(completeTask(task.id)).unwrap();
                            Alert.alert('Success', t('taskDetails.successCompleted'));
                            dispatch(fetchTasks({}));
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert(t('common.error'), error || t('taskDetails.errorComplete'));
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleCancel = async () => {
        Alert.alert(
            t('common.confirm'),
            t('taskDetails.confirmCancel'),
            [
                { text: t('common.back'), style: 'cancel' },
                {
                    text: t('actions.cancel'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await dispatch(cancelTask(task.id)).unwrap();
                            Alert.alert('Success', t('taskDetails.successCancelled'));
                            dispatch(fetchTasks({}));
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert(t('common.error'), error || t('taskDetails.errorCancel'));
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return '#F59E0B';
            case 'ACCEPTED':
                return '#3B82F6';
            case 'COMPLETED':
                return '#10B981';
            case 'REJECTED':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING':
                return t('taskDetails.statusPending');
            case 'ACCEPTED':
                return t('taskDetails.statusAccepted');
            case 'COMPLETED':
                return t('taskDetails.statusCompleted');
            case 'REJECTED':
                return t('taskDetails.statusRejected');
            default:
                return status;
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.header}>
                            <Text style={styles.title}>{task.title}</Text>
                            <Chip
                                style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) }]}
                                textStyle={styles.statusText}
                            >
                                {getStatusLabel(task.status)}
                            </Chip>
                        </View>

                        {task.description && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>📋 {t('taskDetails.description')}</Text>
                                <Text style={styles.description}>{task.description}</Text>
                            </View>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📅 {t('taskDetails.scheduledDate')}</Text>
                            <Text style={styles.infoText}>
                                {new Date(task.scheduledDate).toLocaleDateString('en-GB', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                        </View>

                        {task.location && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>📍 {t('taskDetails.location')}</Text>
                                <Text style={styles.infoText}>{task.location}</Text>
                            </View>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>💰 {t('taskDetails.value')}</Text>
                            <Text style={styles.priceText}>{Number(task.price).toFixed(2)} £</Text>
                        </View>

                        {task.completedAt && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>✅ {t('taskDetails.completedAt')}</Text>
                                <Text style={styles.infoText}>
                                    {new Date(task.completedAt).toLocaleDateString('en-GB', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                {loading && <ActivityIndicator size="large" color="#22c55e" />}

                {!loading && task.status === 'PENDING' && (
                    <View style={styles.buttonRow}>
                        <Button
                            mode="outlined"
                            onPress={handleReject}
                            style={[styles.button, styles.rejectButton]}
                            labelStyle={styles.rejectButtonText}
                        >
                            {t('actions.reject')}
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleAccept}
                            style={[styles.button, styles.acceptButton]}
                            labelStyle={styles.acceptButtonText}
                        >
                            {t('actions.accept')}
                        </Button>
                    </View>
                )}

                {!loading && task.status === 'ACCEPTED' && (
                    <View style={styles.buttonRow}>
                        <Button
                            mode="outlined"
                            onPress={handleCancel}
                            style={[styles.button, styles.cancelButton]}
                            labelStyle={styles.cancelButtonText}
                        >
                            {t('actions.cancel')}
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleComplete}
                            style={[styles.button, styles.completeButton]}
                            labelStyle={styles.completeButtonText}
                        >
                            {t('actions.complete')}
                        </Button>
                    </View>
                )}

                {!loading && (task.status === 'COMPLETED' || task.status === 'REJECTED') && (
                    <Button
                        mode="outlined"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        {t('common.back')}
                    </Button>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e',
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    statusChip: {
        alignSelf: 'flex-start',
    },
    statusText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 6,
    },
    description: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
    },
    infoText: {
        fontSize: 16,
        color: '#111827',
    },
    priceText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#10B981',
    },
    actionContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        borderRadius: 12,
    },
    acceptButton: {
        backgroundColor: '#22c55e',
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rejectButton: {
        borderColor: '#6B7280',
    },
    rejectButtonText: {
        color: '#6B7280',
        fontSize: 16,
    },
    completeButton: {
        backgroundColor: '#16a34a',
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        borderColor: '#EF4444',
    },
    cancelButtonText: {
        color: '#EF4444',
        fontSize: 16,
    },
    backButton: {
        borderRadius: 12,
    },
});
