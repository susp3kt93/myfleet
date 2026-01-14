import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { Text, Avatar, FAB, Card, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { fetchTasks } from '../store/tasksSlice';
import { logout } from '../store/authSlice';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import EarningsChart from '../components/EarningsChart';

export default function EnhancedMainScreen({ navigation }) {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { user, token } = useSelector((state) => state.auth);
    const { tasks, loading } = useSelector((state) => state.tasks);
    const [refreshing, setRefreshing] = React.useState(false);
    const [stats, setStats] = useState(null);
    const [monthlyEarnings, setMonthlyEarnings] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [taskFilter, setTaskFilter] = useState('active'); // active, available, completed
    const [downloadingWeek, setDownloadingWeek] = useState(null);

    const getRecentWeeks = () => {
        const weeks = [];
        const today = new Date();
        // Generate last 8 weeks
        for (let i = 0; i < 8; i++) {
            const date = subWeeks(today, i);
            const start = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
            const end = endOfWeek(date, { weekStartsOn: 0 });     // Saturday

            let label;
            if (i === 0) label = t('common.thisWeek') || 'This Week';
            else if (i === 1) label = t('common.lastWeek') || 'Last Week';
            else label = `${t('common.week') || 'Week'} ${format(start, 'w')}`;

            weeks.push({
                start,
                end,
                label
            });
        }
        return weeks;
    };

    const handleDownloadInvoice = async (week, index) => {
        try {
            setDownloadingWeek(index);
            const startDate = format(week.start, 'yyyy-MM-dd');
            const endDate = format(week.end, 'yyyy-MM-dd');

            const fileUri = FileSystem.documentDirectory + `invoice_${startDate}.pdf`;
            const downloadResumable = FileSystem.createDownloadResumable(
                `${process.env.EXPO_PUBLIC_API_URL}/reports/export/pdf?startDate=${startDate}&endDate=${endDate}`,
                fileUri,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const { uri } = await downloadResumable.downloadAsync();

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', t('earnings.downloadError') || 'Failed to download invoice');
        } finally {
            setDownloadingWeek(null);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        console.log('[MainScreen] Loading data...');
        const today = new Date();
        const startWindow = new Date(today);
        startWindow.setDate(today.getDate() - 30); // 30 days history

        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 14); // 2 weeks future

        console.log('[MainScreen] Fetching tasks from', startWindow.toISOString().split('T')[0], 'to', nextWeek.toISOString().split('T')[0]);
        await dispatch(fetchTasks({
            startDate: startWindow.toISOString().split('T')[0],
            endDate: nextWeek.toISOString().split('T')[0],
        }));

        try {
            console.log('[MainScreen] Fetching stats...');
            const statsRes = await api.get('/driver/stats');
            console.log('[MainScreen] Stats response:', statsRes.data);
            setStats(statsRes.data.stats);

            console.log('[MainScreen] Fetching monthly earnings...');
            const earningsRes = await api.get('/driver/earnings/monthly');
            console.log('[MainScreen] Monthly earnings response:', earningsRes.data);
            setMonthlyEarnings(earningsRes.data.monthlyHistory || []);
        } catch (error) {
            console.error('[MainScreen] Error loading stats:', error);
            console.error('[MainScreen] Error response:', error.response?.data);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        try {
            // Clear auth state first
            await dispatch(logout());

            // Use CommonActions for more reliable navigation reset
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            );
        } catch (error) {
            console.error('Logout error:', error);
            // Force navigation even if logout fails
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            );
        }
    };

    const getFilteredTasks = () => {
        switch (taskFilter) {
            case 'available':
                return tasks.filter(t => t.status === 'PENDING');
            case 'active':
                return tasks.filter(t => t.status === 'ACCEPTED');
            case 'completed':
                return tasks.filter(t => t.status === 'COMPLETED');
            default:
                return tasks;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#F59E0B';
            case 'ACCEPTED': return '#3B82F6';
            case 'COMPLETED': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return t('taskDetails.statusPending');
            case 'ACCEPTED': return t('taskDetails.statusAccepted');
            case 'COMPLETED': return t('taskDetails.statusCompleted');
            default: return status;
        }
    };

    const filteredTasks = getFilteredTasks();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Avatar.Text
                        size={56}
                        label={user?.name?.substring(0, 2).toUpperCase() || 'U'}
                        style={styles.avatar}
                    />
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userRole}>{user?.personalId}</Text>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <LanguageSwitcher />
                    <FAB
                        icon="logout"
                        size="small"
                        onPress={handleLogout}
                        style={styles.logoutButton}
                    />
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <Text
                    style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                    onPress={() => setActiveTab('overview')}
                >
                    {t('tabs.overview')}
                </Text>
                <Text
                    style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
                    onPress={() => setActiveTab('tasks')}
                >
                    {t('tabs.tasks')}
                </Text>
                <Text
                    style={[styles.tab, activeTab === 'earnings' && styles.activeTab]}
                    onPress={() => setActiveTab('earnings')}
                >
                    {t('earnings.title') || 'Câștiguri'}
                </Text>
                <Text
                    style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
                    onPress={() => setActiveTab('profile')}
                >
                    {t('tabs.profile')}
                </Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {activeTab === 'overview' && stats && (
                    <View style={styles.overviewContainer}>
                        {/* Statistics Cards */}
                        <View style={styles.statsGrid}>
                            <Card style={styles.statCard}>
                                <Card.Content>
                                    <Text style={styles.statLabel}>{t('stats.totalEarnings')}</Text>
                                    <Text style={styles.statValue}>{stats.totalEarnings?.toFixed(2)} £</Text>
                                </Card.Content>
                            </Card>

                            <Card style={styles.statCard}>
                                <Card.Content>
                                    <Text style={styles.statLabel}>{t('stats.monthlyEarnings')}</Text>
                                    <Text style={[styles.statValue, { color: '#10B981' }]}>
                                        {stats.monthlyEarnings?.toFixed(2)} £
                                    </Text>
                                </Card.Content>
                            </Card>

                            <Card style={styles.statCard}>
                                <Card.Content>
                                    <Text style={styles.statLabel}>{t('stats.completedTasks')}</Text>
                                    <Text style={[styles.statValue, { color: '#6366F1' }]}>
                                        {stats.completedTasks}
                                    </Text>
                                </Card.Content>
                            </Card>

                            <Card style={styles.statCard}>
                                <Card.Content>
                                    <Text style={styles.statLabel}>{t('stats.rating')}</Text>
                                    <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                                        {stats.rating?.toFixed(1) || 'N/A'}
                                    </Text>
                                </Card.Content>
                            </Card>
                        </View>

                        {/* Earnings Chart */}
                        <Text style={styles.sectionTitle}>{t('earnings.title')}</Text>
                        <EarningsChart data={monthlyEarnings} />

                        {/* Recent Activity */}
                        <Text style={styles.sectionTitle}>{t('tasks.recentActivity') || 'Activitate Recentă'}</Text>
                        {(tasks || []).filter(t => t.status === 'COMPLETED').length > 0 ? (
                            (tasks || []).filter(t => t.status === 'COMPLETED').slice(0, 3).map((task) => (
                                <Card key={task.id} style={styles.taskCard}>
                                    <Card.Content>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View>
                                                <Text style={styles.taskTitle}>{task.title}</Text>
                                                <Text style={styles.taskDate}>
                                                    ✅ {new Date(task.scheduledDate).toLocaleDateString('en-GB')}
                                                </Text>
                                            </View>
                                            <Text style={styles.taskPrice}>
                                                +{Number(task.actualEarnings || task.price).toFixed(2)} £
                                            </Text>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))) : (
                            <Text style={{ color: '#6B7280', marginBottom: 20, marginLeft: 4 }}>Nu există activitate recentă.</Text>
                        )}

                        {/* Recent Tasks */}
                        <Text style={styles.sectionTitle}>{t('tasks.upcomingTasks')}</Text>
                        {tasks.filter(t => t.status !== 'COMPLETED').slice(0, 5).map((task) => (
                            <Card key={task.id} style={styles.taskCard}>
                                <Card.Content>
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                    <Text style={styles.taskDate}>
                                        📅 {new Date(task.scheduledDate).toLocaleDateString('en-GB')}
                                    </Text>
                                    <Text style={styles.taskPrice}>
                                        💰 {Number(task.price).toFixed(2)} £
                                    </Text>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                )}

                {activeTab === 'tasks' && (
                    <View style={styles.tasksContainer}>
                        {/* Filter Buttons */}
                        <View style={styles.filterContainer}>
                            <Button
                                mode={taskFilter === 'active' ? 'contained' : 'outlined'}
                                onPress={() => setTaskFilter('active')}
                                style={styles.filterButton}
                                compact
                            >
                                {t('tasks.active')}
                            </Button>
                            <Button
                                mode={taskFilter === 'available' ? 'contained' : 'outlined'}
                                onPress={() => setTaskFilter('available')}
                                style={styles.filterButton}
                                compact
                            >
                                {t('tasks.available')}
                            </Button>
                            <Button
                                mode={taskFilter === 'completed' ? 'contained' : 'outlined'}
                                onPress={() => setTaskFilter('completed')}
                                style={styles.filterButton}
                                compact
                            >
                                {t('tasks.completed')}
                            </Button>
                        </View>

                        <Text style={styles.sectionTitle}>
                            {taskFilter === 'active' && t('tasks.activeTasks')}
                            {taskFilter === 'available' && t('tasks.availableTasks')}
                            {taskFilter === 'completed' && t('tasks.completedTasks')}
                        </Text>

                        {filteredTasks.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    {taskFilter === 'active' && t('tasks.noActive')}
                                    {taskFilter === 'available' && t('tasks.noAvailable')}
                                    {taskFilter === 'completed' && t('tasks.noCompleted')}
                                </Text>
                            </View>
                        ) : (
                            filteredTasks.map((task) => (
                                <Card
                                    key={task.id}
                                    style={styles.taskCard}
                                    onPress={() => navigation.navigate('TaskDetails', { task })}
                                >
                                    <Card.Content>
                                        <View style={styles.taskHeader}>
                                            <Text style={styles.taskTitle}>{task.title}</Text>
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: getStatusColor(task.status) }
                                                ]}
                                            >
                                                <Text style={styles.statusBadgeText}>
                                                    {getStatusLabel(task.status)}
                                                </Text>
                                            </View>
                                        </View>
                                        {task.description && (
                                            <Text style={styles.taskDescription} numberOfLines={2}>
                                                {task.description}
                                            </Text>
                                        )}
                                        <Text style={styles.taskDate}>
                                            📅 {new Date(task.scheduledDate).toLocaleDateString('en-GB')}
                                        </Text>
                                        {task.location && (
                                            <Text style={styles.taskLocation}>📍 {task.location}</Text>
                                        )}
                                        <View style={styles.taskFooter}>
                                            <Text style={styles.taskPrice}>
                                                💰 {Number(task.price).toFixed(2)} £
                                            </Text>
                                            <Button
                                                mode="text"
                                                compact
                                                onPress={() => navigation.navigate('TaskDetails', { task })}
                                            >
                                                {t('tasks.details')} →
                                            </Button>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))
                        )}
                    </View>
                )}

                {activeTab === 'earnings' && stats && (
                    <View style={styles.earningsContainer}>
                        <Card style={styles.earningsCard}>
                            <Card.Content>
                                <Text style={styles.earningsTitle}>{t('earnings.monthly')}</Text>
                                <Text style={styles.earningsTotal}>
                                    {stats.monthlyEarnings?.toFixed(2)} £
                                </Text>
                                <Text style={styles.earningsSubtitle}>
                                    {stats.monthlyTasks} {t('earnings.tasksCompleted')}
                                </Text>
                            </Card.Content>
                        </Card>

                        <Card style={styles.earningsCard}>
                            <Card.Content>
                                <Text style={styles.earningsTitle}>{t('earnings.weekly')}</Text>
                                <Text style={styles.earningsTotal}>
                                    {stats.weeklyEarnings?.toFixed(2)} £
                                </Text>
                                <Text style={styles.earningsSubtitle}>
                                    {stats.weeklyTasks} {t('earnings.tasksCompleted')}
                                </Text>
                            </Card.Content>
                        </Card>

                        {/* Weekly Invoices */}
                        <Text style={styles.sectionTitle}>{t('earnings.invoices') || 'Weekly Invoices'}</Text>
                        <View style={{ marginBottom: 20 }}>
                            {getRecentWeeks().map((week, index) => (
                                <Card key={index} style={styles.invoiceCard}>
                                    <Card.Content>
                                        <View style={styles.invoiceRow}>
                                            <View>
                                                <Text style={styles.invoicePeriod}>{week.label}</Text>
                                                <Text style={styles.invoiceDate}>
                                                    {format(week.start, 'dd MMM')} - {format(week.end, 'dd MMM yyyy')}
                                                </Text>
                                            </View>
                                            <Button
                                                mode="outlined"
                                                compact
                                                loading={downloadingWeek === index}
                                                disabled={downloadingWeek !== null}
                                                onPress={() => handleDownloadInvoice(week, index)}
                                                icon="download"
                                            >
                                                PDF
                                            </Button>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </View>

                        {/* Monthly History */}
                        <Text style={styles.sectionTitle}>{t('earnings.history')}</Text>
                        {monthlyEarnings.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    {t('earnings.noHistory')}
                                </Text>
                            </View>
                        ) : (
                            monthlyEarnings.map((monthData, index) => (
                                <Card key={monthData.month} style={styles.monthCard}>
                                    <Card.Content>
                                        <View style={styles.monthHeader}>
                                            <View>
                                                <Text style={styles.monthName}>
                                                    {monthData.monthName} {monthData.year}
                                                </Text>
                                                <Text style={styles.monthTasks}>
                                                    {monthData.taskCount} {monthData.taskCount === 1 ? t('earnings.taskCompleted') : t('earnings.tasksCompleted')}
                                                </Text>
                                            </View>
                                            <Text style={styles.monthEarnings}>
                                                {monthData.earnings.toFixed(2)} £
                                            </Text>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))
                        )}
                    </View>
                )}

                {activeTab === 'profile' && (
                    <View style={styles.profileContainer}>
                        {/* User Info Card */}
                        <Card style={styles.profileCard}>
                            <Card.Content>
                                <View style={styles.profileHeader}>
                                    <Avatar.Text
                                        size={64}
                                        label={user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                        style={styles.profileAvatar}
                                    />
                                    <View style={styles.profileInfo}>
                                        <Text style={styles.profileName}>{user?.name}</Text>
                                        <Text style={styles.profileId}>{user?.personalId}</Text>
                                        {user?.email && <Text style={styles.profileEmail}>{user?.email}</Text>}
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>

                        {/* Quick Actions */}
                        <Text style={styles.sectionTitle}>{t('profile.quickActions')}</Text>

                        <Card
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('TimeOff')}
                        >
                            <Card.Content>
                                <View style={styles.actionRow}>
                                    <View style={styles.actionIcon}>
                                        <Text style={{ fontSize: 28 }}>🏖️</Text>
                                    </View>
                                    <View style={styles.actionContent}>
                                        <Text style={styles.actionTitle}>{t('profile.requestTimeOff')}</Text>
                                        <Text style={styles.actionSubtitle}>{t('profile.requestTimeOffDesc')}</Text>
                                    </View>
                                    <Text style={styles.actionArrow}>→</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Vehicle')}
                        >
                            <Card.Content>
                                <View style={styles.actionRow}>
                                    <View style={styles.actionIcon}>
                                        <Text style={{ fontSize: 28 }}>🚗</Text>
                                    </View>
                                    <View style={styles.actionContent}>
                                        <Text style={styles.actionTitle}>{t('profile.myVehicle') || 'My Vehicle'}</Text>
                                        <Text style={styles.actionSubtitle}>{t('profile.myVehicleDesc') || 'View and update mileage'}</Text>
                                    </View>
                                    <Text style={styles.actionArrow}>→</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card
                            style={styles.actionCard}
                            onPress={() => setActiveTab('earnings')}
                        >
                            <Card.Content>
                                <View style={styles.actionRow}>
                                    <View style={styles.actionIcon}>
                                        <Text style={{ fontSize: 28 }}>📊</Text>
                                    </View>
                                    <View style={styles.actionContent}>
                                        <Text style={styles.actionTitle}>{t('profile.statistics')}</Text>
                                        <Text style={styles.actionSubtitle}>
                                            {stats?.completedTasks || 0} {t('profile.tasksCompleted')}
                                        </Text>
                                    </View>
                                    <Text style={styles.actionArrow}>→</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card style={styles.actionCard}>
                            <Card.Content>
                                <View style={styles.actionRow}>
                                    <View style={styles.actionIcon}>
                                        <Text style={{ fontSize: 28 }}>⭐</Text>
                                    </View>
                                    <View style={styles.actionContent}>
                                        <Text style={styles.actionTitle}>Rating</Text>
                                        <Text style={styles.actionSubtitle}>
                                            {stats?.rating?.toFixed(1) || 'N/A'} {t('profile.stars')}
                                        </Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        backgroundColor: '#22c55e',
    },
    userDetails: {
        marginLeft: 16,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    userRole: {
        fontSize: 14,
        color: '#6B7280',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoutButton: {
        backgroundColor: '#EF4444',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        marginRight: 24,
        fontSize: 14,
        color: '#6B7280',
        paddingBottom: 8,
    },
    activeTab: {
        color: '#22c55e',
        fontWeight: '600',
        borderBottomWidth: 2,
        borderBottomColor: '#22c55e',
    },
    content: {
        flex: 1,
    },
    overviewContainer: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        marginBottom: 12,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
        marginTop: 8,
    },
    tasksContainer: {
        padding: 20,
    },
    taskCard: {
        marginBottom: 12,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e',
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    taskDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    taskDate: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    taskLocation: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    taskPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
        marginTop: 4,
    },
    earningsContainer: {
        padding: 20,
    },
    earningsCard: {
        marginBottom: 16,
    },
    earningsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    earningsTotal: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 4,
    },
    earningsSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    invoiceCard: {
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    invoiceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    invoicePeriod: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },
    invoiceDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    filterButton: {
        flex: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    monthCard: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e',
        elevation: 2,
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monthName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    monthTasks: {
        fontSize: 13,
        color: '#6B7280',
    },
    monthEarnings: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10B981',
    },
    profileContainer: {
        padding: 20,
    },
    profileCard: {
        marginBottom: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileAvatar: {
        backgroundColor: '#22c55e',
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    profileId: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    profileEmail: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    actionCard: {
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        flex: 1,
        marginLeft: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    actionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    actionArrow: {
        fontSize: 20,
        color: '#9CA3AF',
    },
});
