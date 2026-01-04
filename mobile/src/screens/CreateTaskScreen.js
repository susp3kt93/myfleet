
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';

import { TextInput, Button, Card, useTheme, ActivityIndicator, HelperText, Menu, Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { usersAPI, tasksAPI } from '../services/api';

export default function CreateTaskScreen({ navigation }) {
    const { t } = useTranslation();
    const theme = useTheme();

    // State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // End Date
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [location, setLocation] = useState('');

    // Driver Selection
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showDriverMenu, setShowDriverMenu] = useState(false);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch drivers on mount
    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        try {
            setLoading(true);
            const response = await usersAPI.getUsers();
            // Filter only drivers
            // API returns { users: [...] }
            const users = response.data.users || [];
            const driverList = users.filter(u => u.role === 'DRIVER');
            setDrivers(driverList);
        } catch (error) {
            console.error('Failed to load drivers:', error);
            Alert.alert('Error', 'Failed to load drivers list');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!title || !price || !date || !selectedDriver) {
            Alert.alert('Error', t('common.error') || 'Please fill in required fields');
            return;
        }

        if (isMultiDay && endDate < date) {
            Alert.alert('Error', 'Data de sfârșit trebuie să fie după data de început');
            return;
        }

        try {
            setSubmitting(true);

            const basePayload = {
                title,
                description,
                price: parseFloat(price),
                location,
                assignedToId: selectedDriver.id
            };

            if (isMultiDay) {
                let currentDate = new Date(date);
                const finalDate = new Date(endDate);

                // Safety check: max 60 days
                const diffTime = Math.abs(finalDate - currentDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 60) {
                    Alert.alert('Error', 'Maximum 60 days allowed');
                    setSubmitting(false);
                    return;
                }

                while (currentDate <= finalDate) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    await tasksAPI.createTask({
                        ...basePayload,
                        scheduledDate: dateStr
                    });
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            } else {
                await tasksAPI.createTask({
                    ...basePayload,
                    scheduledDate: date
                });
            }

            Alert.alert(t('common.success'), t('tasks.successCreated') || 'Task(s) created!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Create task error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to create task');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>{t('tasks.create') || 'Creează Task'}</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        {/* Title */}
                        <TextInput
                            label={t('tasks.title') || 'Titlu'}
                            value={title}
                            onChangeText={setTitle}
                            mode="outlined"
                            outlineColor="#22c55e"
                            activeOutlineColor="#16a34a"
                            style={styles.input}
                        />

                        {/* Description */}
                        <TextInput
                            label={t('tasks.description') || 'Descriere'}
                            value={description}
                            onChangeText={setDescription}
                            mode="outlined"
                            outlineColor="#22c55e"
                            activeOutlineColor="#16a34a"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                        />

                        {/* Price */}
                        <TextInput
                            label={t('tasks.price') || 'Preț (£)'}
                            value={price}
                            onChangeText={setPrice}
                            mode="outlined"
                            outlineColor="#22c55e"
                            activeOutlineColor="#16a34a"
                            keyboardType="numeric"
                            style={styles.input}
                            right={<TextInput.Affix text="£" />}
                        />

                        {/* Date / Start Date */}
                        <TextInput
                            label={isMultiDay ? (t('tasks.startDate') || 'Dată Început') : (t('tasks.date') || 'Dată')}
                            value={date}
                            onChangeText={setDate}
                            mode="outlined"
                            outlineColor="#22c55e"
                            activeOutlineColor="#16a34a"
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                        />

                        {/* Multi Day Switch */}
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>{t('tasks.multipleDays') || 'Repetă pe mai multe zile'}</Text>
                            <Switch
                                value={isMultiDay}
                                onValueChange={setIsMultiDay}
                                color="#22c55e"
                            />
                        </View>

                        {/* End Date - Visible only if Multi Day */}
                        {isMultiDay && (
                            <TextInput
                                label={t('tasks.endDate') || 'Dată Sfârșit'}
                                value={endDate}
                                onChangeText={setEndDate}
                                mode="outlined"
                                outlineColor="#22c55e"
                                activeOutlineColor="#16a34a"
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                            />
                        )}

                        <HelperText type="info" visible={true}>
                            Format: YYYY-MM-DD (Ex: 2026-02-15)
                        </HelperText>

                        {/* Location */}
                        <TextInput
                            label={t('tasks.location') || 'Locație'}
                            value={location}
                            onChangeText={setLocation}
                            mode="outlined"
                            outlineColor="#22c55e"
                            activeOutlineColor="#16a34a"
                            style={styles.input}
                        />

                        {/* Driver Selector */}
                        <View style={styles.driverSection}>
                            <Text style={styles.label}>{t('tasks.assignTo') || 'Atribuie Șoferului:'}</Text>
                            <Menu
                                visible={showDriverMenu}
                                onDismiss={() => setShowDriverMenu(false)}
                                anchor={
                                    <Button
                                        mode="outlined"
                                        onPress={() => setShowDriverMenu(true)}
                                        textColor="#16a34a"
                                        style={{ borderColor: '#22c55e' }}
                                    >
                                        {selectedDriver ? selectedDriver.name : (t('common.select') || 'Selectează')}
                                    </Button>
                                }
                            >
                                {drivers.map(driver => (
                                    <Menu.Item
                                        key={driver.id}
                                        onPress={() => {
                                            setSelectedDriver(driver);
                                            setShowDriverMenu(false);
                                        }}
                                        title={driver.name}
                                        leadingIcon="account"
                                    />
                                ))}
                            </Menu>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={submitting}
                            disabled={submitting}
                            style={styles.submitButton}
                            buttonColor="#22c55e"
                        >
                            {t('common.save') || 'Salvează'}
                        </Button>

                        <Button
                            mode="text"
                            onPress={() => navigation.goBack()}
                            textColor="#666"
                            style={{ marginTop: 8 }}
                        >
                            {t('common.cancel') || 'Anulează'}
                        </Button>

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
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        elevation: 4,
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    driverSection: {
        marginTop: 8,
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
    },
    submitButton: {
        marginTop: 16,
        paddingVertical: 6,
    }
});
