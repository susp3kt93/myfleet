
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { DatePickerInput, registerTranslation, enGB } from 'react-native-paper-dates';
import { useTranslation } from 'react-i18next';

registerTranslation('en-GB', enGB);

export default function TimeOffDialog({ visible, onDismiss, onSave, request, loading }) {
    const { t } = useTranslation();
    const theme = useTheme();

    const [startDate, setStartDate] = useState(undefined);
    const [endDate, setEndDate] = useState(undefined);
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (visible) {
            if (request) {
                setStartDate(request.requestDate ? new Date(request.requestDate) : undefined);
                setEndDate(request.endDate ? new Date(request.endDate) : undefined);
                setReason(request.reason || '');
            } else {
                setStartDate(undefined);
                setEndDate(undefined);
                setReason('');
            }
            setErrors({});
        }
    }, [visible, request]);

    const validate = () => {
        const newErrors = {};
        if (!startDate) newErrors.startDate = t('common.required', 'Required');

        if (startDate && endDate) {
            if (endDate < startDate) {
                newErrors.endDate = t('timeoff.endDateError', 'End date must be after start date');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        onSave({
            requestDate: startDate,
            endDate: endDate,
            reason
        });
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text variant="titleLarge">
                        {request ? 'Edit Request' : 'New Request'}
                    </Text>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.dateRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <DatePickerInput
                                locale="en-GB"
                                label="Start Date"
                                value={startDate}
                                onChange={d => setStartDate(d)}
                                inputMode="start"
                                mode="outlined"
                                hasError={!!errors.startDate}
                            />
                            {errors.startDate && (
                                <HelperText type="error" visible={!!errors.startDate}>
                                    {errors.startDate}
                                </HelperText>
                            )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <DatePickerInput
                                locale="en-GB"
                                label="End Date"
                                value={endDate}
                                onChange={d => setEndDate(d)}
                                inputMode="start"
                                mode="outlined"
                                hasError={!!errors.endDate}
                            />
                            {errors.endDate && (
                                <HelperText type="error" visible={!!errors.endDate}>
                                    {errors.endDate}
                                </HelperText>
                            )}
                        </View>
                    </View>

                    <TextInput
                        label="Reason"
                        mode="outlined"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                    />
                </ScrollView>

                <View style={styles.actions}>
                    <Button onPress={onDismiss} style={styles.button}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        {t('common.save', 'Save')}
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
        maxHeight: '80%'
    },
    header: {
        marginBottom: 16,
    },
    content: {
        marginBottom: 16
    },
    dateRow: {
        flexDirection: 'row',
        marginBottom: 16
    },
    input: {
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8
    },
    button: {
        minWidth: 80
    }
});
