import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, List, Divider, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { activityAPI } from '../services/api';
import LanguageSwitcher from './LanguageSwitcher';

export default function AdminSettingsView() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [activity, setActivity] = useState([]);

    useEffect(() => {
        loadActivity();
    }, []);

    const loadActivity = async () => {
        try {
            setLoading(true);
            const response = await activityAPI.getActivity({ limit: 10 });
            setActivity(response.data || []);
        } catch (error) {
            console.error('Error loading activity:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Settings Section */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.title}>⚙️ Settings</Text>
                    </Card.Content>

                    <List.Section>
                        <List.Item
                            title="Language"
                            description="Change app language"
                            left={props => <List.Icon {...props} icon="translate" />}
                            right={() => <LanguageSwitcher />}
                        />
                        <Divider />
                        <List.Item
                            title="Company Profile"
                            description="Manage company details"
                            left={props => <List.Icon {...props} icon="office-building" />}
                            onPress={() => Alert.alert('Coming Soon', 'Company profile editing coming soon!')}
                        />
                        <Divider />
                        <List.Item
                            title="Notifications"
                            description="Manage notification preferences"
                            left={props => <List.Icon {...props} icon="bell" />}
                            onPress={() => Alert.alert('Coming Soon', 'Notification settings coming soon!')}
                        />
                    </List.Section>
                </Card>

                {/* Activity Log Section */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.title}>📝 Recent Activity</Text>
                    </Card.Content>

                    {loading ? (
                        <View style={styles.loading}>
                            <ActivityIndicator size="small" color="#22c55e" />
                        </View>
                    ) : activity.length > 0 ? (
                        <List.Section>
                            {activity.map((item, index) => (
                                <React.Fragment key={index}>
                                    <List.Item
                                        title={item.action || 'Activity'}
                                        description={item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy HH:mm') : ''}
                                        left={props => <List.Icon {...props} icon="history" />}
                                    />
                                    {index < activity.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List.Section>
                    ) : (
                        <Card.Content>
                            <Text style={styles.empty}>No recent activity</Text>
                        </Card.Content>
                    )}
                </Card>

                {/* About Section */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.title}>About</Text>
                        <Text variant="bodyMedium" style={styles.version}>
                            MyFleet Admin v1.0.0
                        </Text>
                        <Text variant="bodySmall" style={styles.copyright}>
                            © 2026 MyFleet. All rights reserved.
                        </Text>
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    title: {
        marginBottom: 8,
    },
    loading: {
        padding: 16,
        alignItems: 'center',
    },
    empty: {
        textAlign: 'center',
        color: '#999',
        padding: 16,
    },
    version: {
        color: '#666',
        marginTop: 8,
    },
    copyright: {
        color: '#999',
        marginTop: 4,
    },
});
