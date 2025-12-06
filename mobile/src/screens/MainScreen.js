import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Avatar, FAB, Card, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchTasks } from '../store/tasksSlice';
import { logout } from '../store/authSlice';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function EnhancedMainScreen({ navigation }) {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { user } = useSelector((state) => state.auth);
    const { tasks, loading } = useSelector((state) => state.tasks);
    const [refreshing, setRefreshing] = React.useState(false);
    const [stats, setStats] = useState(null);
    const [monthlyEarnings, setMonthlyEarnings] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [taskFilter, setTaskFilter] = useState('available'); // available, active, completed

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        console.log('[MainScreen] Loading data...');
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        console.log('[MainScreen] Fetching tasks from', today.toISOString().split('T')[0], 'to', nextWeek.toISOString().split('T')[0]);
        await dispatch(fetchTasks({
            startDate: today.toISOString().split('T')[0],
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

    const handleLogout = () => {
        dispatch(logout());
        navigation.replace('Login');
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
            case 'PENDING': return 'DISPONIBIL';
            case 'ACCEPTED': return 'ÎN LUCRU';
            case 'COMPLETED': return 'FINALIZAT';
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
                    {t('tabs.earnings')}
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
                                    <Text style={styles.statValue}>{stats.totalEarnings?.toFixed(2)} RON</Text>
                                </Card.Content>
                            </Card>

                            <Card style={styles.statCard}>
                                <Card.Content>
                                    <Text style={styles.statLabel}>{t('stats.monthlyEarnings')}</Text>
                                    <Text style={[styles.statValue, { color: '#10B981' }]}>
                                        {stats.monthlyEarnings?.toFixed(2)} RON
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

                        <Text style={styles.sectionTitle}>{t('tasks.upcomingTasks')}</Text>
                        {tasks.slice(0, 5).map((task) => (
                            <Card key={task.id} style={styles.taskCard}>
                                <Card.Content>
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                    <Text style={styles.taskDate}>
                                        📅 {new Date(task.scheduledDate).toLocaleDateString('ro-RO')}
                                    </Text>
                                    <Text style={styles.taskPrice}>
                                        💰 {Number(task.price).toFixed(2)} RON
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
                                mode={taskFilter === 'available' ? 'contained' : 'outlined'}
                                onPress={() => setTaskFilter('available')}
                                style={styles.filterButton}
                                compact
                            >
                                {t('tasks.available')}
                            </Button>
                            <Button
                                mode={taskFilter === 'active' ? 'contained' : 'outlined'}
                                onPress={() => setTaskFilter('active')}
                                style={styles.filterButton}
                                compact
                            >
                                {t('tasks.active')}
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
                            {taskFilter === 'available' && t('tasks.availableTasks')}
                            {taskFilter === 'active' && t('tasks.activeTasks')}
                            {taskFilter === 'completed' && t('tasks.completedTasks')}
                        </Text>

                        {filteredTasks.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    {taskFilter === 'available' && t('tasks.noAvailable')}
                                    {taskFilter === 'active' && t('tasks.noActive')}
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
                                            📅 {new Date(task.scheduledDate).toLocaleDateString('ro-RO')}
                                        </Text>
                                        {task.location && (
                                            <Text style={styles.taskLocation}>📍 {task.location}</Text>
                                        )}
                                        <View style={styles.taskFooter}>
                                            <Text style={styles.taskPrice}>
                                                💰 {Number(task.price).toFixed(2)} RON
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
                                    {stats.monthlyEarnings?.toFixed(2)} RON
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
                                    {stats.weeklyEarnings?.toFixed(2)} RON
                                </Text>
                                <Text style={styles.earningsSubtitle}>
                                    {stats.weeklyTasks} {t('earnings.tasksCompleted')}
                                </Text>
                            </Card.Content>
                        </Card>

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
                                                {monthData.earnings.toFixed(2)} RON
                                            </Text>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))
                        )}
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
        backgroundColor: '#4F46E5',
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
        color: '#4F46E5',
        fontWeight: '600',
        borderBottomWidth: 2,
        borderBottomColor: '#4F46E5',
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
});
