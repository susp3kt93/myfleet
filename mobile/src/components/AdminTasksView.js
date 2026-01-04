
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, IconButton, Avatar, Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from 'date-fns';
import { enGB, ro } from 'date-fns/locale';
import { tasksAPI } from '../services/api';

const getStatusColor = (status) => {
    switch (status) {
        case 'COMPLETED': return '#22c55e';
        case 'ACCEPTED': return '#3b82f6';
        case 'REJECTED': return '#ef4444';
        case 'CANCELLED': return '#9ca3af';
        default: return '#f59e0b'; // PENDING
    }
};

export default function AdminTasksView({ tasks, drivers, onRefresh }) {
    const { t, i18n } = useTranslation();
    const theme = useTheme();

    // State
    const [activeTab, setActiveTab] = useState('ALL');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'driver'
    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );

    const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const dateLocale = i18n.language === 'ro' ? ro : enGB;

    const navigateWeek = (direction) => {
        if (direction === 'prev') setCurrentWeekStart(prev => subWeeks(prev, 1));
        else if (direction === 'next') setCurrentWeekStart(prev => addWeeks(prev, 1));
        else setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    };

    const isCurrent = () => {
        const now = startOfWeek(new Date(), { weekStartsOn: 1 });
        return currentWeekStart.getTime() === now.getTime();
    };

    // Filter Logic
    const filteredTasks = useMemo(() => {
        let result = tasks || [];

        // 1. Status Filter
        if (activeTab !== 'ALL') {
            result = result.filter(t => t.status === activeTab);
        }

        // 2. Week Filter
        result = result.filter(t => {
            if (!t.scheduledDate) return false;
            const tDate = new Date(t.scheduledDate);
            return isWithinInterval(tDate, { start: currentWeekStart, end: currentWeekEnd });
        });

        // 3. Sort (Date Ascending)
        result.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

        return result;
    }, [tasks, activeTab, currentWeekStart, currentWeekEnd]);

    // Group by Driver
    const tasksByDriver = useMemo(() => {
        if (viewMode !== 'driver') return [];

        const groupedMap = {};

        // Initialize with all drivers
        drivers.forEach(d => {
            groupedMap[d.id] = { driver: d, tasks: [] };
        });

        // Add Unassigned bucket
        groupedMap['unassigned'] = {
            driver: { id: 'unassigned', name: t('tasks.unassigned') || 'Unassigned', personalId: '---' },
            tasks: []
        };

        // Distribute tasks
        filteredTasks.forEach(t => {
            const driverId = t.assignedToId || 'unassigned';
            if (!groupedMap[driverId]) {
                // Driver might be soft-deleted or not in list, fallback
                groupedMap[driverId] = { driver: { name: 'Unknown', personalId: '???' }, tasks: [] };
            }
            groupedMap[driverId].tasks.push(t);
        });

        // Convert to array and filter out empty if desired (or keep to show idle drivers)
        // Web mimics: Show drivers. 
        return Object.values(groupedMap).filter(g => g.driver.id !== 'unassigned' || g.tasks.length > 0);
    }, [filteredTasks, viewMode, drivers, t]);


    // Actions
    const handleDelete = (taskId) => {
        Alert.alert(
            t('common.delete'),
            t('tasks.confirmDelete') || 'Delete this task?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'), style: 'destructive', onPress: async () => {
                        try {
                            await tasksAPI.deleteTask(taskId);
                            if (onRefresh) onRefresh();
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete task');
                        }
                    }
                }
            ]
        );
    };

    const handleComplete = (taskId) => {
        Alert.alert(
            t('tasks.complete'),
            'Mark task as COMPLETED?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.complete'), onPress: async () => {
                        try {
                            await tasksAPI.completeTask(taskId);
                            if (onRefresh) onRefresh();
                        } catch (e) {
                            Alert.alert('Error', 'Failed to complete task');
                        }
                    }
                }
            ]
        );
    };

    const renderTaskCard = (item) => {
        const isCompleted = item.status === 'COMPLETED';
        const color = getStatusColor(item.status);

        return (
            <Card style={[styles.card, { borderLeftColor: color }]} mode="elevated" key={item.id}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        <Chip textStyle={{ fontSize: 10, marginVertical: -4 }} style={{ height: 24, backgroundColor: theme.colors.surfaceVariant }}>
                            {item.status}
                        </Chip>
                    </View>

                    <View style={styles.cardRow}>
                        <Text style={{ color: '#666', fontSize: 13 }}>
                            📅 {format(new Date(item.scheduledDate), 'dd MMM yyyy', { locale: dateLocale })}
                            {item.scheduledTime ? ` • ${item.scheduledTime}` : ''}
                        </Text>
                        <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>£{item.price}</Text>
                    </View>

                    {item.location && (
                        <View style={styles.locationRow}>
                            <Text numberOfLines={1} style={{ color: '#666', fontSize: 12 }}>📍 {item.location}</Text>
                        </View>
                    )}

                    <Divider style={{ marginVertical: 8 }} />

                    <View style={styles.cardActions}>
                        {item.assignedTo ? (
                            <View style={styles.driverInfo}>
                                <Avatar.Text size={24} label={item.assignedTo.name[0]} style={{ backgroundColor: theme.colors.primaryContainer }} />
                                <Text style={styles.driverName}>{item.assignedTo.name}</Text>
                            </View>
                        ) : (
                            <Text style={{ color: 'orange', fontSize: 12, fontStyle: 'italic' }}>Unassigned</Text>
                        )}

                        <View style={{ flexDirection: 'row' }}>
                            {!isCompleted && item.status !== 'CANCELLED' && (
                                <IconButton icon="check" size={20} iconColor="green" onPress={() => handleComplete(item.id)} />
                            )}
                            <IconButton icon="delete" size={20} iconColor="red" onPress={() => handleDelete(item.id)} />
                        </View>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            {/* Week Navigation */}
            <View style={styles.weekNav}>
                <IconButton icon="chevron-left" onPress={() => navigateWeek('prev')} />
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                        {format(currentWeekStart, 'dd MMM')} - {format(currentWeekEnd, 'dd MMM')}
                    </Text>
                    <TouchableOpacity onPress={() => navigateWeek('current')}>
                        <Text style={{ fontSize: 12, color: isCurrent() ? '#22c55e' : '#666' }}>
                            {isCurrent() ? 'Current Week' : 'Go to Today'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <IconButton icon="chevron-right" onPress={() => navigateWeek('next')} />
            </View>

            {/* Filters */}
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', paddingVertical: 4 }}>
                    {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'].map((status, index) => (
                        <Chip
                            key={status}
                            selected={activeTab === status}
                            onPress={() => setActiveTab(status)}
                            mode="outlined"
                            style={[
                                { marginRight: 8 },
                                activeTab === status ? { borderColor: theme.colors.primary, backgroundColor: theme.colors.secondaryContainer } : {}
                            ]}
                        >
                            {status}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {/* View Mode Toggle */}
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                <SegmentedButtons
                    value={viewMode}
                    onValueChange={setViewMode}
                    buttons={[
                        { value: 'list', label: t('admin.listView') || 'List' },
                        { value: 'driver', label: t('admin.driverView') || 'By Driver' },
                    ]}
                />
            </View>

            {/* Content */}
            {viewMode === 'list' && (
                <FlatList
                    data={filteredTasks}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => renderTaskCard(item)}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#999' }}>No tasks found for this week</Text>}
                />
            )}

            {viewMode === 'driver' && (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {tasksByDriver.map(group => (
                        <View key={group.driver.id} style={styles.driverGroup}>
                            <View style={styles.driverHeader}>
                                <Text style={styles.driverTitle}>{group.driver.name}</Text>
                                <Chip compact>{group.tasks.length}</Chip>
                            </View>
                            {group.tasks.map(task => renderTaskCard(task))}
                            {group.tasks.length === 0 && <Text style={{ fontSize: 12, color: '#aaa', marginLeft: 16, marginBottom: 8 }}>No tasks assigned</Text>}
                        </View>
                    ))}
                    {tasksByDriver.length === 0 && <Text style={{ textAlign: 'center', marginTop: 32, color: '#999' }}>No drivers found</Text>}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    weekNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: '#fff',
        elevation: 1,
        marginBottom: 8,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 12,
        backgroundColor: '#fff',
        borderLeftWidth: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        flex: 1,
        fontWeight: 'bold',
        marginRight: 8,
        fontSize: 16,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    locationRow: {
        marginBottom: 4,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverName: {
        marginLeft: 8,
        fontSize: 13,
        color: '#444',
    },
    driverGroup: {
        marginBottom: 24,
    },
    driverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    driverTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});
