
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Avatar, Portal, Modal, HelperText, useTheme, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { usersAPI } from '../services/api';

export default function AdminDriversView({ drivers, onRefresh }) {
    const { t } = useTranslation();
    const theme = useTheme();

    // State
    const [modalVisible, setModalVisible] = useState(false);
    const [mode, setMode] = useState('create'); // 'create' | 'edit'
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        personalId: '',
        email: '',
        phone: '',
        password: '',
        rating: '5.0'
    });

    const initCreate = () => {
        setMode('create');
        setFormData({
            name: '',
            personalId: '',
            email: '',
            phone: '',
            password: '',
            rating: '5.0'
        });
        setModalVisible(true);
    };

    const initEdit = (driver) => {
        setMode('edit');
        setEditingId(driver.id);
        setFormData({
            name: driver.name,
            personalId: driver.personalId,
            email: driver.email || '',
            phone: driver.phone || '',
            password: '', // Password usually empty on edit unless changing
            rating: String(driver.rating || '5.0')
        });
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.personalId) {
            Alert.alert('Error', t('common.error') || 'Name and ID are required');
            return;
        }

        try {
            setLoading(true);

            if (mode === 'create') {
                if (!formData.password) {
                    Alert.alert('Error', 'Password is required for new users');
                    setLoading(false);
                    return;
                }
                const payload = {
                    ...formData,
                    role: 'DRIVER' // Default to driver for now
                };
                await usersAPI.createUser(payload);
                Alert.alert('Success', 'Driver created');
            } else {
                const updates = { ...formData };
                if (!updates.password) delete updates.password; // Don't send empty password

                // Convert rating to float
                updates.rating = parseFloat(updates.rating);

                await usersAPI.updateUser(editingId, updates);
                Alert.alert('Success', 'Driver updated');
            }

            setModalVisible(false);
            if (onRefresh) onRefresh();

        } catch (error) {
            console.error('User save error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            t('common.delete'),
            t('tasks.confirmDelete') || 'Are you sure?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'), style: 'destructive', onPress: async () => {
                        try {
                            await usersAPI.deleteUser(id);
                            if (onRefresh) onRefresh();
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card} mode="elevated">
            <Card.Content>
                <View style={styles.row}>
                    <View style={styles.userInfo}>
                        <Avatar.Text size={40} label={item.name.substring(0, 2).toUpperCase()} style={{ backgroundColor: theme.colors.primary }} />
                        <View style={{ marginLeft: 12 }}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.name}</Text>
                            <Text style={{ color: '#666', fontSize: 12 }}>{item.personalId}</Text>
                        </View>
                    </View>
                    <View style={styles.ratingBadge}>
                        <Text style={{ fontWeight: 'bold', color: '#f59e0b' }}>★ {item.rating || 'N/A'}</Text>
                    </View>
                </View>

                <View style={{ marginTop: 8 }}>
                    {item.email ? <Text style={styles.contactText}>📧 {item.email}</Text> : null}
                    {item.phone ? <Text style={styles.contactText}>📞 {item.phone}</Text> : null}
                </View>

                <View style={styles.actions}>
                    <Button
                        mode="outlined"
                        compact
                        onPress={() => initEdit(item)}
                        style={{ marginRight: 8, borderColor: theme.colors.primary }}
                        textColor={theme.colors.primary}
                    >
                        Edit
                    </Button>
                    <Button
                        mode="outlined"
                        compact
                        onPress={() => handleDelete(item.id)}
                        style={{ borderColor: theme.colors.error }}
                        textColor={theme.colors.error}
                    >
                        Delete
                    </Button>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Button mode="contained" icon="plus" onPress={initCreate} buttonColor="#22c55e">
                    {t('drivers.add') || 'Add Driver'}
                </Button>
            </View>

            <FlatList
                data={drivers}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                style={{ flex: 1 }}
            />

            <Portal>
                <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
                    <ScrollView>
                        <Text style={styles.modalTitle}>{mode === 'create' ? (t('drivers.create') || 'New Driver') : (t('drivers.edit') || 'Edit Driver')}</Text>

                        <TextInput
                            label={t('drivers.name') || "Name"}
                            value={formData.name}
                            onChangeText={txt => setFormData({ ...formData, name: txt })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Personal ID (Login)"
                            value={formData.personalId}
                            onChangeText={txt => setFormData({ ...formData, personalId: txt.toUpperCase() })}
                            style={styles.input}
                            mode="outlined"
                            disabled={mode === 'edit'} // Usually ID is immutable or handled with care
                        />
                        <TextInput
                            label="Email"
                            value={formData.email}
                            onChangeText={txt => setFormData({ ...formData, email: txt })}
                            style={styles.input}
                            mode="outlined"
                            keyboardType="email-address"
                        />
                        <TextInput
                            label="Phone"
                            value={formData.phone}
                            onChangeText={txt => setFormData({ ...formData, phone: txt })}
                            style={styles.input}
                            mode="outlined"
                            keyboardType="phone-pad"
                        />

                        <TextInput
                            label={mode === 'create' ? "Password *" : "New Password (Optional)"}
                            value={formData.password}
                            onChangeText={txt => setFormData({ ...formData, password: txt })}
                            style={styles.input}
                            mode="outlined"
                            secureTextEntry
                        />

                        {mode === 'edit' && (
                            <TextInput
                                label="Rating"
                                value={formData.rating}
                                onChangeText={txt => setFormData({ ...formData, rating: txt })}
                                style={styles.input}
                                mode="outlined"
                                keyboardType="numeric"
                            />
                        )}

                        <View style={styles.modalActions}>
                            <Button onPress={() => setModalVisible(false)} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
                            <Button mode="contained" onPress={handleSubmit} loading={loading} buttonColor="#22c55e">{t('common.save')}</Button>
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, alignItems: 'flex-end' },
    list: { padding: 16, paddingTop: 0 },
    card: { marginBottom: 12, backgroundColor: 'white' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    contactText: { fontSize: 13, color: '#666', marginTop: 2 },
    ratingBadge: { backgroundColor: '#fffbeb', padding: 4, borderRadius: 4, borderWidth: 1, borderColor: '#fcd34d' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
    modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8, maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    input: { marginBottom: 12, backgroundColor: 'white', height: 45 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }
});
