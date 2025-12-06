import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { acceptTask, rejectTask, completeTask, cancelTask, fetchTasks } from '../store/tasksSlice';

export default function TaskDetailsScreen({ route, navigation }) {
    const { task } = route.params;
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        try {
            setLoading(true);
            await dispatch(acceptTask(task.id)).unwrap();
            Alert.alert('Success', 'Task acceptat cu succes!');
            dispatch(fetchTasks({})); // Refresh task list
            navigation.goBack();
        } catch (error) {
            Alert.alert('Eroare', error || 'Nu s-a putut accepta task-ul');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        Alert.alert(
            'Confirmare',
            'Sigur vrei să refuzi acest task?',
            [
                { text: 'Anulează', style: 'cancel' },
                {
                    text: 'Refuză',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await dispatch(rejectTask(task.id)).unwrap();
                            Alert.alert('Success', 'Task refuzat');
                            dispatch(fetchTasks({}));
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Eroare', error || 'Nu s-a putut refuza task-ul');
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
            'Confirmare',
            'Marchează task-ul ca finalizat?',
            [
                { text: 'Anulează', style: 'cancel' },
                {
                    text: 'Finalizează',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await dispatch(completeTask(task.id)).unwrap();
                            Alert.alert('Success', 'Task finalizat cu succes!');
                            dispatch(fetchTasks({}));
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Eroare', error || 'Nu s-a putut finaliza task-ul');
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
            'Confirmare',
            'Sigur vrei să anulezi acest task?',
            [
                { text: 'Nu', style: 'cancel' },
                {
                    text: 'Da, anulează',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await dispatch(cancelTask(task.id)).unwrap();
                            Alert.alert('Success', 'Task anulat');
                            dispatch(fetchTasks({}));
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Eroare', error || 'Nu s-a putut anula task-ul');
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
                return 'DISPONIBIL';
            case 'ACCEPTED':
                return 'ÎN LUCRU';
            case 'COMPLETED':
                return 'FINALIZAT';
            case 'REJECTED':
                return 'REFUZAT';
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
                                <Text style={styles.sectionTitle}>📋 Descriere</Text>
                                <Text style={styles.description}>{task.description}</Text>
                            </View>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📅 Data Programată</Text>
                            <Text style={styles.infoText}>
                                {new Date(task.scheduledDate).toLocaleDateString('ro-RO', {
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
                                <Text style={styles.sectionTitle}>📍 Locație</Text>
                                <Text style={styles.infoText}>{task.location}</Text>
                            </View>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>💰 Valoare</Text>
                            <Text style={styles.priceText}>{Number(task.price).toFixed(2)} RON</Text>
                        </View>

                        {task.completedAt && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>✅ Finalizat La</Text>
                                <Text style={styles.infoText}>
                                    {new Date(task.completedAt).toLocaleDateString('ro-RO', {
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
                {loading && <ActivityIndicator size="large" color="#4F46E5" />}

                {!loading && task.status === 'PENDING' && (
                    <View style={styles.buttonRow}>
                        <Button
                            mode="outlined"
                            onPress={handleReject}
                            style={[styles.button, styles.rejectButton]}
                            labelStyle={styles.rejectButtonText}
                        >
                            Refuză
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleAccept}
                            style={[styles.button, styles.acceptButton]}
                            labelStyle={styles.acceptButtonText}
                        >
                            Acceptă
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
                            Anulează
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleComplete}
                            style={[styles.button, styles.completeButton]}
                            labelStyle={styles.completeButtonText}
                        >
                            Finalizează
                        </Button>
                    </View>
                )}

                {!loading && (task.status === 'COMPLETED' || task.status === 'REJECTED') && (
                    <Button
                        mode="outlined"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        Înapoi
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
        backgroundColor: '#10B981',
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
        backgroundColor: '#3B82F6',
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
