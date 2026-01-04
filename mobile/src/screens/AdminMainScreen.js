
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Avatar, FAB, Card, Button, Divider, Badge, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { adminAPI, usersAPI, tasksAPI } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import EarningsChart from '../components/EarningsChart';
import AdminTasksView from '../components/AdminTasksView';
import AdminDriversView from '../components/AdminDriversView';

export default function AdminMainScreen({ navigation }) {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { user } = useSelector((state) => state.auth);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [recentTasks, setRecentTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            console.log('Loading admin data...');

            // 1. Fetch Company Stats
            if (user?.companyId) {
                const statsRes = await adminAPI.getCompanyStats(user.companyId);
                setStats(statsRes.data);
            }

            // 2. Fetch Drivers (Users filtered)
            const usersRes = await usersAPI.getUsers();
            const allUsers = usersRes.data.users || [];
            // Filter: If company admin, only show own company drivers? 
            // API usually handles permission filtering. Assuming retrieval is correct.
            const driverList = allUsers.filter(u => u.role === 'DRIVER');
            setDrivers(driverList);

            // 3. Fetch Tasks
            const tasksRes = await tasksAPI.getTasks({ companyId: user.companyId });
            const allTasks = tasksRes.data.tasks || [];
            console.log(`Fetched ${allTasks.length} tasks`);

            // Sort by date desc
            allTasks.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
            setRecentTasks(allTasks);

        } catch (error) {
            console.error('Admin load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.companyId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <Button
                mode={activeTab === 'overview' ? 'contained' : 'text'}
                onPress={() => setActiveTab('overview')}
                style={styles.tab}
                buttonColor={activeTab === 'overview' ? '#22c55e' : undefined}
                textColor={activeTab === 'overview' ? 'white' : '#666'}
            >
                {t('admin.presentation') || 'Overview'}
            </Button>
            <Button
                mode={activeTab === 'drivers' ? 'contained' : 'text'}
                onPress={() => setActiveTab('drivers')}
                style={styles.tab}
                buttonColor={activeTab === 'drivers' ? '#22c55e' : undefined}
                textColor={activeTab === 'drivers' ? 'white' : '#666'}
            >
                {t('admin.drivers') || 'Drivers'}
            </Button>
            <Button
                mode={activeTab === 'tasks' ? 'contained' : 'text'}
                onPress={() => setActiveTab('tasks')}
                style={styles.tab}
                buttonColor={activeTab === 'tasks' ? '#22c55e' : undefined}
                textColor={activeTab === 'tasks' ? 'white' : '#666'}
            >
                {t('admin.tasks') || 'Tasks'}
            </Button>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text variant="headlineMedium" style={styles.title}>
                        {user?.company?.name || 'Company Dashboard'}
                    </Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        {user?.name}
                    </Text>
                </View>
                <View>
                    <LanguageSwitcher />
                </View>
            </View>

            {/* Tabs */}
            {renderTabs()}

            {/* Content Area */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#22c55e" />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {activeTab === 'overview' && (
                        <ScrollView
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                            contentContainerStyle={styles.content}
                        >
                            {/* Stats Grid */}
                            <View style={styles.statsGrid}>
                                <Card style={styles.statCard}>
                                    <Card.Content>
                                        <Text style={styles.statLabel}>{t('stats.activeDrivers')}</Text>
                                        <Text style={styles.statValue}>{drivers.length}</Text>
                                    </Card.Content>
                                </Card>
                                <Card style={styles.statCard}>
                                    <Card.Content>
                                        <Text style={styles.statLabel}>{t('stats.tasksToday') || 'Tasks Pending'}</Text>
                                        <Text style={styles.statValue}>{stats?.pendingTasks || 0}</Text>
                                    </Card.Content>
                                </Card>
                                <Card style={styles.statCard}>
                                    <Card.Content>
                                        <Text style={styles.statLabel}>{t('stats.completedTasks')}</Text>
                                        <Text style={[styles.statValue, { color: '#10B981' }]}>{stats?.completedTasks || 0}</Text>
                                    </Card.Content>
                                </Card>
                                <Card style={styles.statCard}>
                                    <Card.Content>
                                        <Text style={styles.statLabel}>{t('stats.totalRevenue')}</Text>
                                        <Text style={[styles.statValue, { color: '#10B981', fontSize: 20 }]}>
                                            {stats?.totalEarnings?.toFixed(2) || '0.00'} £
                                        </Text>
                                    </Card.Content>
                                </Card>
                            </View>

                            {/* Monthly Earnings */}
                            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                {t('earnings.monthly') || 'Monthly Earnings'}
                            </Text>
                            <EarningsChart data={stats?.monthlyHistory || []} />

                            {/* Short Recent Activity */}
                            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                {t('admin.recentActivity') || 'Recent Activity'}
                            </Text>
                            {recentTasks.slice(0, 3).map(task => (
                                <Card key={task.id} style={styles.card}>
                                    <Card.Content>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                                                <Text style={styles.taskDate}>
                                                    {new Date(task.scheduledDate).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            <Badge style={{ backgroundColor: task.status === 'COMPLETED' ? '#22c55e' : '#f59e0b', alignSelf: 'flex-start' }}>
                                                {task.status}
                                            </Badge>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </ScrollView>
                    )}

                    {activeTab === 'drivers' && (
                        <AdminDriversView drivers={drivers} onRefresh={onRefresh} />
                    )}

                    {activeTab === 'tasks' && (
                        <AdminTasksView tasks={recentTasks} drivers={drivers} onRefresh={onRefresh} />
                    )}
                </View>
            )}

            {/* Global FAB for Creating Tasks - Visible on Overview and Tasks tab */}
            {activeTab !== 'drivers' && (
                <FAB
                    style={styles.fab}
                    icon="plus"
                    color="white"
                    onPress={() => navigation.navigate('CreateTask')}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        backgroundColor: '#22c55e',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4
    },
    title: { color: 'white', fontWeight: 'bold', fontSize: 22 },
    subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'white',
        paddingVertical: 8,
        elevation: 2,
        marginBottom: 1
    },
    tab: { borderRadius: 20 },
    content: { padding: 16, paddingBottom: 80 },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12
    },
    statCard: {
        width: '48%',
        marginBottom: 12,
        backgroundColor: 'white'
    },
    statLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
    card: { marginBottom: 12, backgroundColor: 'white' },
    taskTitle: { fontSize: 16, fontWeight: '600' },
    taskDate: { fontSize: 14, color: '#6B7280' },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#22c55e',
    },
});
