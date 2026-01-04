import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';

export default function EarningsChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No earnings data available</Text>
            </View>
        );
    }

    // Take last 6 months
    const chartData = data.slice(0, 6).reverse();
    const maxEarnings = Math.max(...chartData.map(d => d.earnings), 1); // Avoid division by zero

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                {chartData.map((item, index) => {
                    const heightPercentage = (item.earnings / maxEarnings) * 100;
                    // Clamp between 10% and 100% for visual aesthetics
                    const barHeight = Math.max(heightPercentage, 10);

                    return (
                        <View key={index} style={styles.column}>
                            <View style={styles.barContainer}>
                                <Text style={styles.barValue}>{item.earnings > 0 ? `${Math.round(item.earnings)}£` : ''}</Text>
                                <View style={[styles.bar, { height: `${barHeight}%` }]} />
                            </View>
                            <Text style={styles.label} numberOfLines={1}>
                                {item.monthName.substring(0, 3)}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 180,
        paddingTop: 20,
    },
    column: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
    },
    barContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
    },
    bar: {
        width: 12,
        backgroundColor: '#22c55e', // Green theme
        borderRadius: 6,
        opacity: 0.8,
    },
    barValue: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 4,
    },
    label: {
        marginTop: 8,
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#9CA3AF',
    },
});
