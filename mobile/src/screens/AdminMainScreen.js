import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, FAB, Badge, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/authSlice';
import { adminAPI, usersAPI, tasksAPI } from '../services/api';

// Components
import AdminTasksView from '../components/AdminTasksView';
import AdminDriversView from '../components/AdminDriversView';
import AdminTimeOffView from '../components/AdminTimeOffView';
import AdminDeductionsView from '../components/AdminDeductionsView';
import AdminVehiclesView from '../components/AdminVehiclesView';
import AdminReportsView from '../components/AdminReportsView';
import AdminSettingsView from '../components/AdminSettingsView';
import EarningsChart from '../components/EarningsChart';

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
    const [company, setCompany] = useState(null);

    const loadData = useCallback(async () => {
        try {
            // 1. Fetch Company Stats
            if (user?.companyId) {
                const statsRes = await adminAPI.getCompanyStats(user.companyId);
                setStats(statsRes.data);
            }

            // 2. Fetch Drivers
            const usersRes = await usersAPI.getUsers();
            const allUsers = usersRes.data.users || [];
            setDrivers(allUsers.filter(u => u.role === 'DRIVER'));

            // 3. Fetch Tasks
            const tasksRes = await tasksAPI.getTasks({ companyId: user.companyId });
            const allTasks = tasksRes.data.tasks || [];
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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const handleLogout = async () => {
        try {
            await dispatch(logout());
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            );
        } catch (error) {
            console.error('Logout error:', error);
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            );
        }
    };

    const tabs = [
        { id: 'overview', label: t('admin.overview') || 'Overview', icon: 'view-dashboard' },
        { id: 'drivers', label: t('admin.drivers') || 'Drivers', icon: 'account-group' },
        { id: 'tasks', label: t('admin.tasks') || 'Tasks', icon: 'clipboard-list' },
        { id: 'reports', label: t('admin.reports') || 'Reports', icon: 'chart-bar' },
        { id: 'deductions', label: t('admin.deductions') || 'Deductions', icon: 'cash-minus' },
        { id: 'timeoff', label: t('admin.timeOff') || 'Time-Off', icon: 'calendar-clock' },
        { id: 'vehicles', label: t('admin.vehicles') || 'Vehicles', icon: 'car' },
        { id: 'more', label: t('admin.more') || 'More', icon: 'dots-horizontal' },
    ];

    const renderOverview = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Stats Overview */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>{t('stats.activeDrivers')}</Text>
                    <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats?.activeDrivers || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>{t('stats.activeTasks')}</Text>
                    <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats?.activeTasks || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>{t('stats.completedTasks')}</Text>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>{stats?.completedTasks || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>{t('stats.totalRevenue')}</Text>
                    <Text style={[styles.statValue, { color: '#10B981', fontSize: 20 }]}>
                        {stats?.totalEarnings?.toFixed(2) || '0.00'} £
                    </Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>{t('earnings.monthly') || 'Monthly Earnings'}</Text>
            <EarningsChart data={stats?.monthlyHistory || []} />
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.title}>{user?.name}</Text>
                        <Text style={styles.subtitle}>{company?.name || 'Company Admin'}</Text>
                    </View>
                    {company?.logoUrl && (
                        <Image
                            source={{ uri: company.logoUrl }}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    )}
                </View>
                <Button
                    mode="contained"
                    onPress={handleLogout}
                    buttonColor="#dc2626"
                    compact
                    labelStyle={{ fontSize: 12 }}
                >
                    Logout
                </Button>
            </View>

            {/* Tab Navigation */}
            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabBar}
                    contentContainerStyle={styles.tabContent}
                >
                    {tabs.map(tab => (
                        <Button
                            key={tab.id}
                            mode={activeTab === tab.id ? 'contained' : 'text'}
                            onPress={() => setActiveTab(tab.id)}
                            buttonColor={activeTab === tab.id ? '#22c55e' : undefined}
                            textColor={activeTab === tab.id ? 'white' : '#666'}
                            style={styles.tab}
                            compact
                        >
                            {tab.label}
                        </Button>
                    ))}
                </ScrollView>
            </View>

            {/* Content Area - FLEX 1 IS CRITICAL HERE */}
            <View style={styles.contentArea}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'drivers' && <AdminDriversView drivers={drivers} onRefresh={onRefresh} />}
                {activeTab === 'tasks' && <AdminTasksView tasks={recentTasks} drivers={drivers} onRefresh={onRefresh} />}
                {activeTab === 'reports' && <AdminReportsView />}
                {activeTab === 'deductions' && <AdminDeductionsView onRefresh={onRefresh} />}
                {activeTab === 'timeoff' && <AdminTimeOffView onRefresh={onRefresh} />}
                {activeTab === 'vehicles' && <AdminVehiclesView drivers={drivers} onRefresh={onRefresh} />}
                {activeTab === 'more' && <AdminSettingsView />}
            </View>

            {/* FAB - Only visible on Overview and Tasks */}
            {(activeTab === 'overview' || activeTab === 'tasks') && (
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
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#22c55e',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 22,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    tabBar: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tabContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        gap: 8,
    },
    tab: {
        borderRadius: 20,
    },
    contentArea: {
        flex: 1, // TAKES ALL REMAINING SPACE
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 80,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1F2937',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#22c55e',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logo: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
});
