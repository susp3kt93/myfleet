import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Avatar, FAB, Card, Button, List, Divider, Badge } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/authSlice';
import { adminAPI, usersAPI, tasksAPI } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AdminMainScreen({ navigation }) {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { user } = useSelector((state) => state.auth);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [recentTasks, setRecentTasks] = useState([]);

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // First fetch users to count drivers
            const usersRes = await usersAPI.getUsers();
            // The API returns { users: [...] } so we need usersRes.data.users
            const usersList = usersRes.data.users || [];
            const allDrivers = usersList.filter(u => u.role === 'DRIVER');
            setDrivers(allDrivers);

            // Fetch tasks
            const tasksRes = await tasksAPI.getTasks({ limit: 20 });
            // The API returns { tasks: [...] }
            const tasksList = tasksRes.data.tasks || [];
            setRecentTasks(tasksList);

            if (isSuperAdmin) {
                // Calculate stats for Super Admin from the pulled lists
                const pendingTasks = tasksList.filter(t => {
                    const tDate = new Date(t.scheduledDate);
                    const today = new Date();
                    return tDate.getDate() === today.getDate() &&
                        tDate.getMonth() === today.getMonth() &&
                        tDate.getFullYear() === today.getFullYear();
                }).length;

                const completedTasks = tasksList.filter(t => t.status === 'COMPLETED').length;
                const totalEarnings = tasksList
                    .filter(t => t.status === 'COMPLETED')
                    .reduce((acc, t) => acc + Number(t.price), 0);

                setStats({
                    activeDrivers: allDrivers.length,
                    pendingTasks, // Using "Tasks Today" label effectively
                    completedTasks,
                    totalEarnings
                });
            } else if (user?.companyId) {
                const statsRes = await adminAPI.getCompanyStats(user.companyId);
                setStats(statsRes.data);
            }

        } catch (error) {
            console.error('Error loading admin data:', error);
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Avatar.Text
                        size={56}
                        label={user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                        style={styles.avatar}
                    />
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userRole}>
                            {isSuperAdmin ? t('admin.superAdmin') : t('admin.companyAdmin')}
                        </Text>
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

            <View style={styles.tabs}>
                <Text
                    style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                    onPress={() => setActiveTab('overview')}
                >
                    {t('admin.presentation')}
                </Text>
                <Text
                    style={[styles.tab, activeTab === 'drivers' && styles.activeTab]}
                    onPress={() => setActiveTab('drivers')}
                >
                    {t('admin.drivers')}
                </Text>
                <Text
                    style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
                    onPress={() => setActiveTab('tasks')}
                >
                    {t('admin.tasks')}
                </Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {activeTab === 'overview' && (
                    <View style={styles.section}>
                        <View style={styles.statsGrid}>
                            <Card style={styles.statCard}>
                                <Card.Content>
                                    <Text style={styles.statLabel}>{t('stats.activeDrivers')}</Text>
                                    <Text style={styles.statValue}>{stats?.activeDrivers || drivers.length || 0}</Text>
                                </Card.Content>
                            </Card>
                            <Card style={styles.statCard}>
                                <Card.Content>
                                    <Text style={styles.statLabel}>{t('stats.tasksToday')}</Text>
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
                                        {stats?.totalEarnings?.toFixed(2) || '0.00'} RON
                                    </Text>
                                </Card.Content>
                            </Card>
                        </View>
                    </View>
                )}

                {activeTab === 'drivers' && (
                    <View style={styles.section}>
                        {drivers.map(driver => (
                            <Card key={driver.id} style={styles.card}>
                                <Card.Title
                                    title={driver.name}
                                    subtitle={driver.phone || driver.email}
                                    left={(props) => <Avatar.Text {...props} label={driver.name.substring(0, 2)} />}
                                    right={(props) => <Badge style={{ backgroundColor: '#10B981', marginRight: 10 }}>{t('admin.active')}</Badge>}
                                />
                            </Card>
                        ))}
                    </View>
                )}

                {activeTab === 'tasks' && (
                    <View style={styles.section}>
                        {recentTasks.map(task => (
                            <Card key={task.id} style={styles.card}>
                                <Card.Content>
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                    <Text style={styles.taskDate}>📅 {new Date(task.scheduledDate).toLocaleDateString()}</Text>
                                    <Text style={styles.taskStatus}>{task.status}</Text>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
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
    userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { backgroundColor: '#4F46E5' },
    userDetails: { marginLeft: 16 },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    userRole: { fontSize: 14, color: '#6B7280' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoutButton: { backgroundColor: '#EF4444' },
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
    content: { flex: 1 },
    section: { padding: 20 },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        marginBottom: 12,
    },
    statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    card: { marginBottom: 12 },
    taskTitle: { fontSize: 16, fontWeight: '600' },
    taskDate: { fontSize: 14, color: '#6B7280' },
    taskStatus: { fontSize: 12, marginTop: 4, fontWeight: 'bold', color: '#4F46E5' }
});
