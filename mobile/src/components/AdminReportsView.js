import { DatePickerModal } from 'react-native-paper-dates';
// ... other imports

export default function AdminReportsView() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);

    // Date Range State
    const [range, setRange] = useState({
        startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
        endDate: endOfWeek(new Date(), { weekStartsOn: 1 })
    });
    const [open, setOpen] = useState(false);

    const onDismiss = React.useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const onConfirm = React.useCallback(
        ({ startDate, endDate }) => {
            setOpen(false);
            setRange({ startDate, endDate });
        },
        [setOpen, setRange]
    );

    const generateReport = async () => {
        try {
            if (!range.startDate || !range.endDate) {
                Alert.alert('Error', 'Please select a date range');
                return;
            }
            setLoading(true);
            const startDateStr = format(range.startDate, 'yyyy-MM-dd');
            const endDateStr = format(range.endDate, 'yyyy-MM-dd'); // User selecting range usually expects end of day inclusive, API handles logic

            const response = await reportsAPI.getWeeklyReport(startDateStr, endDateStr);
            setReport(response.data.report || []);
        } catch (error) {
            console.error('Error generating report:', error);
            Alert.alert('Error', 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    // ... (exportCSV)

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.title}>{t('admin.reports') || 'Reports'}</Text>

                        <View style={styles.dateContainer}>
                            <Button
                                mode="outlined"
                                onPress={() => setOpen(true)}
                                icon="calendar"
                                style={styles.dateButton}
                            >
                                {range.startDate && range.endDate
                                    ? `${format(range.startDate, 'dd MMM')} - ${format(range.endDate, 'dd MMM yyyy')}`
                                    : 'Select Date Range'}
                            </Button>
                        </View>

                        <DatePickerModal
                            locale="en_GB"
                            mode="range"
                            visible={open}
                            onDismiss={onDismiss}
                            startDate={range.startDate}
                            endDate={range.endDate}
                            onConfirm={onConfirm}
                            saveLabel="Save" // optional
                            label="Select period" // optional
                            startLabel="From" // optional
                            endLabel="To" // optional
                        />

                        <Button
                            mode="contained"
                            onPress={generateReport}
                            loading={loading}
                            style={styles.button}
                        >
                            Generate Report
                        </Button>
                    </Card.Content>
                </Card>

                {report && report.length > 0 ? (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Report Summary
                            </Text>
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title>Driver</DataTable.Title>
                                    <DataTable.Title numeric>Tasks</DataTable.Title>
                                    <DataTable.Title numeric>Earnings</DataTable.Title>
                                    <DataTable.Title numeric>Net Pay</DataTable.Title>
                                </DataTable.Header>

                                {report.map((row, index) => (
                                    <DataTable.Row key={index}>
                                        <DataTable.Cell>{row.name}</DataTable.Cell>
                                        <DataTable.Cell numeric>{row.completed_tasks}</DataTable.Cell>
                                        <DataTable.Cell numeric>£{row.total_earnings}</DataTable.Cell>
                                        <DataTable.Cell numeric>£{row.net_pay}</DataTable.Cell>
                                    </DataTable.Row>
                                ))}
                            </DataTable>

                            <Button
                                mode="outlined"
                                icon="download"
                                onPress={exportCSV}
                                style={styles.exportButton}
                            >
                                Export to CSV
                            </Button>
                        </Card.Content>
                    </Card>
                ) : (
                    report && report.length === 0 && (
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text style={styles.empty}>No report data for this period</Text>
                            </Card.Content>
                        </Card>
                    )
                )}
            </ScrollView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    title: {
        marginBottom: 8,
    },
    subtitle: {
        color: '#666',
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
    },
    sectionTitle: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    exportButton: {
        marginTop: 16,
    },
    empty: {
        textAlign: 'center',
        marginTop: 32,
        color: '#999',
        fontSize: 16,
    },
});
