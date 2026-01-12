import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, HelperText, SegmentedButtons, Menu, Divider } from 'react-native-paper';
import { DatePickerInput } from 'react-native-paper-dates'; // Assuming this exists or using DatePickerModal
import { DatePickerModal } from 'react-native-paper-dates';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export default function DeductionDialog({ visible, onDismiss, onSubmit, deduction, drivers = [] }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('OTHER');
    const [frequency, setFrequency] = useState('ONE_TIME');
    const [userId, setUserId] = useState(''); // Driver ID
    const [startDate, setStartDate] = useState(undefined);
    const [endDate, setEndDate] = useState(undefined);

    // UI State
    const [driverMenuVisible, setDriverMenuVisible] = useState(false);
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    // Errors
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (visible) {
            if (deduction) {
                // Edit Mode
                setDescription(deduction.description || '');
                setAmount(deduction.amount?.toString() || '');
                setType(deduction.type || 'OTHER');
                setFrequency(deduction.frequency || 'ONE_TIME');
                setUserId(deduction.userId || '');
                setStartDate(deduction.startDate ? new Date(deduction.startDate) : undefined);
                setEndDate(deduction.endDate ? new Date(deduction.endDate) : undefined);
            } else {
                // Create Mode - Reset
                setDescription('');
                setAmount('');
                setType('OTHER');
                setFrequency('ONE_TIME');
                setUserId('');
                setStartDate(undefined);
                setEndDate(undefined);
            }
            setErrors({});
        }
    }, [visible, deduction]);

    const validate = () => {
        const newErrors = {};
        if (!description) newErrors.description = 'Description is required';
        if (!amount || isNaN(amount)) newErrors.amount = 'Valid amount is required';
        if (!userId) newErrors.userId = 'Driver is required';
        if (!startDate) newErrors.startDate = 'Start date is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const data = {
                description,
                amount: parseFloat(amount),
                type,
                frequency,
                userId,
                startDate,
                endDate
            };
            await onSubmit(data); // onSubmit should handle API call and closing
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedDriver = drivers.find(d => d.id === userId);

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContent}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>
                        {deduction ? 'Edit Deduction' : 'New Deduction'}
                    </Text>

                    {/* Driver Selection */}
                    <View style={styles.inputContainer}>
                        <Menu
                            visible={driverMenuVisible}
                            onDismiss={() => setDriverMenuVisible(false)}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setDriverMenuVisible(true)}
                                    style={styles.dropdownButton}
                                    disabled={!!deduction} // Disable changing driver in edit mode if desired, usually safer
                                >
                                    {selectedDriver ? (selectedDriver.name || selectedDriver.personalId) : 'Select Driver'}
                                </Button>
                            }
                        >
                            <ScrollView style={{ maxHeight: 200 }}>
                                {drivers.map(driver => (
                                    <Menu.Item
                                        key={driver.id}
                                        onPress={() => {
                                            setUserId(driver.id);
                                            setDriverMenuVisible(false);
                                        }}
                                        title={`${driver.name} (${driver.personalId || 'N/A'})`}
                                    />
                                ))}
                            </ScrollView>
                        </Menu>
                        {errors.userId && <HelperText type="error">{errors.userId}</HelperText>}
                    </View>

                    {/* Description */}
                    <TextInput
                        label="Description"
                        value={description}
                        onChangeText={setDescription}
                        mode="outlined"
                        style={styles.input}
                        error={!!errors.description}
                    />
                    {errors.description && <HelperText type="error">{errors.description}</HelperText>}

                    {/* Amount */}
                    <TextInput
                        label="Amount (£)"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                        error={!!errors.amount}
                        left={<TextInput.Affix text="£" />}
                    />
                    {errors.amount && <HelperText type="error">{errors.amount}</HelperText>}

                    {/* Type */}
                    <Text style={styles.label}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentScroll}>
                        <SegmentedButtons
                            value={type}
                            onValueChange={setType}
                            buttons={[
                                { value: 'VAN_RENTAL', label: 'Van' },
                                { value: 'FUEL', label: 'Fuel' },
                                { value: 'INSURANCE', label: 'Ins.' },
                                { value: 'PENALTY', label: 'Fine' },
                                { value: 'OTHER', label: 'Other' },
                            ]}
                            style={styles.segment}
                            density="small"
                        />
                    </ScrollView>

                    {/* Frequency */}
                    <Text style={styles.label}>Frequency</Text>
                    <SegmentedButtons
                        value={frequency}
                        onValueChange={setFrequency}
                        buttons={[
                            { value: 'ONE_TIME', label: 'One Time' },
                            { value: 'WEEKLY', label: 'Weekly' },
                            { value: 'MONTHLY', label: 'Monthly' },
                        ]}
                        style={styles.segment}
                    />

                    {/* Dates */}
                    <View style={styles.dateRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Button p
                                mode="outlined"
                                onPress={() => setStartDateOpen(true)}
                            >
                                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Start Date'}
                            </Button>
                            {errors.startDate && <HelperText type="error">{errors.startDate}</HelperText>}
                        </View>

                        <View style={{ flex: 1 }}>
                            <Button
                                mode="outlined"
                                onPress={() => setEndDateOpen(true)}
                            >
                                {endDate ? format(endDate, 'dd/MM/yyyy') : 'End Date (Opt)'}
                            </Button>
                        </View>
                    </View>

                    {/* Date Pickers */}
                    <DatePickerModal
                        locale="en"
                        mode="single"
                        visible={startDateOpen}
                        onDismiss={() => setStartDateOpen(false)}
                        date={startDate}
                        onConfirm={({ date }) => {
                            setStartDateOpen(false);
                            setStartDate(date);
                        }}
                    />

                    <DatePickerModal
                        locale="en"
                        mode="single"
                        visible={endDateOpen}
                        onDismiss={() => setEndDateOpen(false)}
                        date={endDate}
                        onConfirm={({ date }) => {
                            setEndDateOpen(false);
                            setEndDate(date);
                        }}
                    />

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button onPress={onDismiss} style={styles.button}>Cancel</Button>
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={loading}
                            style={styles.button}
                        >
                            Save
                        </Button>
                    </View>
                </ScrollView>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 8,
        maxHeight: '90%',
    },
    scroll: {
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 12,
    },
    input: {
        marginBottom: 4,
        backgroundColor: 'white',
    },
    dropdownButton: {
        borderColor: '#ccc',
        marginTop: 4,
    },
    label: {
        marginTop: 12,
        marginBottom: 4,
        color: '#666',
        fontSize: 12,
    },
    segment: {
        marginBottom: 12,
    },
    segmentScroll: {
        marginBottom: 12,
        flexGrow: 0,
    },
    dateRow: {
        flexDirection: 'row',
        marginTop: 8,
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    button: {
        marginLeft: 8,
    },
});
