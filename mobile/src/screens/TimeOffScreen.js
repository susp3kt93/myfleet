import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    TextInput,
    Modal,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import { timeoffAPI } from '../services/api';
import { useTranslation } from 'react-i18next';

const TimeOffScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await timeoffAPI.getRequests();
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching time-off requests:', error);
            Alert.alert(t('common.error'), t('timeOff.errorLoad'));
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    }, []);

    const handleSubmit = async () => {
        if (!selectedDate) {
            Alert.alert(t('common.error'), t('timeOff.errorSelectDate'));
            return;
        }

        try {
            setSubmitting(true);
            await timeoffAPI.createRequest(selectedDate, reason);
            Alert.alert(t('common.success'), t('timeOff.successSubmitted'));
            setShowModal(false);
            setSelectedDate(null);
            setReason('');
            fetchRequests();
        } catch (error) {
            console.error('Error creating request:', error);
            const message = error.response?.data?.error || t('timeOff.errorSubmit');
            Alert.alert(t('common.error'), message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        Alert.alert(
            t('common.confirm'),
            t('timeOff.confirmCancel'),
            [
                { text: t('timeOff.no'), style: 'cancel' },
                {
                    text: t('timeOff.yesCancel'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await timeoffAPI.cancelRequest(id);
                            Alert.alert(t('common.success'), t('timeOff.successCancelled'));
                            fetchRequests();
                        } catch (error) {
                            console.error('Error cancelling request:', error);
                            Alert.alert(t('common.error'), t('timeOff.errorCancel'));
                        }
                    }
                }
            ]
        );
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING':
                return { bg: '#FEF3C7', text: '#D97706', label: t('timeOff.statusPending') };
            case 'APPROVED':
                return { bg: '#D1FAE5', text: '#059669', label: t('timeOff.statusApproved') };
            case 'REJECTED':
                return { bg: '#FEE2E2', text: '#DC2626', label: t('timeOff.statusRejected') };
            default:
                return { bg: '#F3F4F6', text: '#6B7280', label: status };
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const generateDateOptions = () => {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 1; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push({
                value: date.toISOString().split('T')[0],
                label: date.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long'
                })
            });
        }
        return dates;
    };

    const renderRequest = ({ item }) => {
        const status = getStatusStyle(item.status);

        return (
            <View style={styles.requestCard}>
                <View style={styles.requestHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>
                            {status.label}
                        </Text>
                    </View>
                    {item.status === 'PENDING' && (
                        <TouchableOpacity
                            onPress={() => handleCancel(item.id)}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelButtonText}>{t('actions.cancel')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.dateText}>📅 {formatDate(item.requestDate)}</Text>

                {item.reason && (
                    <Text style={styles.reasonText}>📝 {item.reason}</Text>
                )}

                {item.adminNotes && (
                    <Text style={styles.adminNotes}>💬 Admin: {item.adminNotes}</Text>
                )}

                <Text style={styles.createdText}>
                    {t('timeOff.requestSent')} {new Date(item.createdAt).toLocaleDateString('en-GB')}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>{t('timeOff.back')}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🏖️ {t('timeOff.title')}</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* New Request Button */}
            <TouchableOpacity
                style={styles.newRequestButton}
                onPress={() => setShowModal(true)}
            >
                <Text style={styles.newRequestButtonText}>{t('timeOff.requestButton')}</Text>
            </TouchableOpacity>

            {/* Requests List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>{t('timeOff.loading')}</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>{t('timeOff.noRequests')}</Text>
                            <Text style={styles.emptySubtext}>
                                {t('timeOff.noRequestsHint')}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* New Request Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>📅 {t('profile.requestTimeOff')}</Text>

                        <Text style={styles.modalLabel}>{t('timeOff.selectDate')}</Text>
                        <FlatList
                            data={generateDateOptions()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.value}
                            style={styles.dateList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.dateOption,
                                        selectedDate === item.value && styles.dateOptionSelected
                                    ]}
                                    onPress={() => setSelectedDate(item.value)}
                                >
                                    <Text style={[
                                        styles.dateOptionText,
                                        selectedDate === item.value && styles.dateOptionTextSelected
                                    ]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />

                        <Text style={styles.modalLabel}>{t('timeOff.reasonOptional')}</Text>
                        <TextInput
                            style={styles.reasonInput}
                            value={reason}
                            onChangeText={setReason}
                            placeholder={t('timeOff.reasonPlaceholder')}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setShowModal(false);
                                    setSelectedDate(null);
                                    setReason('');
                                }}
                            >
                                <Text style={styles.modalCancelButtonText}>{t('actions.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalSubmitButton,
                                    (!selectedDate || submitting) && styles.modalSubmitButtonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={!selectedDate || submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.modalSubmitButtonText}>{t('timeOff.submitRequest')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#22c55e',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    newRequestButton: {
        backgroundColor: '#22c55e',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    newRequestButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    listContent: {
        padding: 16,
    },
    requestCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    cancelButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    cancelButtonText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '500',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    reasonText: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
    },
    adminNotes: {
        fontSize: 14,
        color: '#22c55e',
        fontStyle: 'italic',
        marginTop: 8,
    },
    createdText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
        marginTop: 12,
    },
    dateList: {
        maxHeight: 50,
    },
    dateOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        marginRight: 8,
    },
    dateOptionSelected: {
        backgroundColor: '#4F46E5',
    },
    dateOptionText: {
        fontSize: 14,
        color: '#4B5563',
    },
    dateOptionTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    reasonInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 24,
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    modalCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    modalSubmitButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
    },
    modalSubmitButtonDisabled: {
        backgroundColor: '#A5B4FC',
    },
    modalSubmitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default TimeOffScreen;
