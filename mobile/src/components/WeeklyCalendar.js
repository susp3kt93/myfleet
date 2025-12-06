import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function WeeklyCalendar({ tasks = [] }) {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const getTasksForDay = (day) => {
        return tasks.filter((task) => {
            try {
                return isSameDay(new Date(task.scheduledDate), day);
            } catch {
                return false;
            }
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACCEPTED':
                return '#10B981';
            case 'REJECTED':
                return '#EF4444';
            case 'PENDING':
                return '#F59E0B';
            default:
                return '#6B7280';
        }
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {weekDays.map((day, index) => {
                const dayTasks = getTasksForDay(day);
                const isToday = isSameDay(day, today);

                return (
                    <View
                        key={index}
                        style={[
                            styles.dayCard,
                            isToday && styles.todayCard
                        ]}
                    >
                        <Text style={[styles.dayName, isToday && styles.todayText]}>
                            {format(day, 'EEE')}
                        </Text>
                        <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                            {format(day, 'd')}
                        </Text>

                        <View style={styles.tasksIndicator}>
                            {dayTasks.length > 0 ? (
                                <View style={styles.taskDots}>
                                    {dayTasks.slice(0, 3).map((task, idx) => (
                                        <View
                                            key={idx}
                                            style={[
                                                styles.taskDot,
                                                { backgroundColor: getStatusColor(task.status) }
                                            ]}
                                        />
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <Text style={styles.moreText}>+{dayTasks.length - 3}</Text>
                                    )}
                                </View>
                            ) : (
                                <Text style={styles.noTasks}>-</Text>
                            )}
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    content: {
        paddingHorizontal: 20,
        gap: 12,
    },
    dayCard: {
        width: 70,
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    todayCard: {
        borderColor: '#4F46E5',
        backgroundColor: '#EEF2FF',
    },
    dayName: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    dayNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    todayText: {
        color: '#4F46E5',
    },
    tasksIndicator: {
        minHeight: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskDots: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
    },
    taskDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    moreText: {
        fontSize: 10,
        color: '#6B7280',
        marginLeft: 2,
    },
    noTasks: {
        fontSize: 12,
        color: '#D1D5DB',
    },
});
