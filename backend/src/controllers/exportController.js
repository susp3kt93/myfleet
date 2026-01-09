import { PrismaClient } from '@prisma/client';
import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';
import { format, addDays, eachDayOfInterval, parseISO } from 'date-fns';
import { enGB } from 'date-fns/locale';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper: Generate array of dates from startDate to endDate (inclusive)
const getDateRange = (startDate, endDate) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    let current = new Date(start);
    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

// Helper: Check if two dates are the same day (ignoring time)
const isSameDate = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

// CSV Export for Company Admins - UK Format
export const generateWeeklyCSV = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        // Get company filter from middleware
        const companyFilter = req.companyFilter || {};

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Fetch tasks for the week
        const tasks = await prisma.task.findMany({
            where: {
                ...companyFilter,
                scheduledDate: {
                    gte: start,
                    lte: end
                },
                status: 'COMPLETED'
            },
            include: {
                assignedTo: {
                    select: {
                        name: true,
                        personalId: true
                    }
                }
            },
            orderBy: [
                { scheduledDate: 'asc' },
                { assignedTo: { name: 'asc' } }
            ]
        });

        // Format data for CSV with GBP
        const csvData = tasks.map(task => ({
            'Driver Name': task.assignedTo?.name || 'Unassigned',
            'Personal ID': task.assignedTo?.personalId || '-',
            'Route/Task': task.title,
            'Date': format(new Date(task.scheduledDate), 'dd/MM/yyyy'),
            'Day': format(new Date(task.scheduledDate), 'EEEE', { locale: enGB }),
            'Location': task.location || '-',
            'Earnings (£)': (task.actualEarnings || task.price || 0).toFixed(2),
            'Status': task.status,
            'Time': task.scheduledTime || '-'
        }));

        // Add totals row
        const totalEarnings = tasks.reduce((sum, task) => sum + (task.actualEarnings || task.price || 0), 0);
        csvData.push({
            'Driver Name': 'TOTAL',
            'Personal ID': '',
            'Route/Task': '',
            'Date': '',
            'Day': '',
            'Location': '',
            'Earnings (£)': totalEarnings.toFixed(2),
            'Status': tasks.length + ' tasks',
            'Time': ''
        });

        // Generate CSV
        const csv = stringify(csvData, {
            header: true,
            columns: [
                'Driver Name',
                'Personal ID',
                'Route/Task',
                'Date',
                'Day',
                'Location',
                'Earnings (£)',
                'Status',
                'Time'
            ]
        });

        // Set headers for download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${format(start, 'dd-MM-yyyy')}.csv"`);
        res.send(csv);

    } catch (error) {
        console.error('CSV generation error:', error);
        res.status(500).json({ error: 'Failed to generate CSV report' });
    }
};

// PDF Invoice Export for Drivers - UK Format with all days in range
// PDF Invoice Export for Drivers - UK Format with all days in range
export const generateDriverInvoice = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let driverId = req.user.id;

        // Allow Admins to generate for other drivers
        if ((req.user.role === 'COMPANY_ADMIN' || req.user.role === 'SUPER_ADMIN') && req.query.driverId) {
            driverId = req.query.driverId;
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        console.log(`[Invoice] Generating for driver ${driverId}, period: ${startDate} to ${endDate}`);

        // Fetch driver details
        const driver = await prisma.user.findUnique({
            where: { id: driverId },
            include: {
                company: true
            }
        });

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Security check for Company Admin
        if (req.user.role === 'COMPANY_ADMIN' && driver.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Unauthorized: Driver belongs to another company' });
        }

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Use dates directly from frontend (frontend already calculates Sunday-Saturday)
        // Parse dates at noon to avoid timezone shifting issues
        const weekStart = new Date(startDate + 'T12:00:00');
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(endDate + 'T12:00:00');
        weekEnd.setHours(23, 59, 59, 999);

        console.log(`[Invoice] Using dates from frontend: ${format(weekStart, 'yyyy-MM-dd')} to ${format(weekEnd, 'yyyy-MM-dd')}`);

        // Generate all dates in the range (using noon to avoid timezone issues)
        const getDateRangeSafe = (start, end) => {
            const dates = [];
            let current = new Date(start);
            current.setHours(12, 0, 0, 0);
            const endDate = new Date(end);
            endDate.setHours(12, 0, 0, 0);

            while (current <= endDate) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            return dates;
        };

        const weekDates = getDateRangeSafe(weekStart, weekEnd);

        console.log(`[Invoice] Week dates: ${weekDates.map(d => format(d, 'EEEE dd/MM', { locale: enGB })).join(', ')}`);

        // Fetch all tasks for the driver in this period
        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: driverId,
                scheduledDate: {
                    gte: weekStart,
                    lte: weekEnd
                }
            },
            orderBy: { scheduledDate: 'asc' }
        });

        console.log(`[Invoice] Found ${tasks.length} tasks`);
        tasks.forEach(t => console.log(`  - ${t.title}: ${new Date(t.scheduledDate).toISOString()} (${t.status})`));

        // Fetch time-off requests for this week
        const timeOffRequests = await prisma.timeOffRequest.findMany({
            where: {
                userId: driverId,
                status: 'APPROVED',
                OR: [
                    // Single day in range
                    {
                        endDate: null,
                        requestDate: {
                            gte: weekStart,
                            lte: weekEnd
                        }
                    },
                    // Range overlapping
                    {
                        endDate: { not: null },
                        AND: [
                            { requestDate: { lte: weekEnd } },
                            { endDate: { gte: weekStart } }
                        ]
                    }
                ]
            }
        });

        console.log(`[Invoice] Found ${timeOffRequests.length} time-off requests`);

        // Check if a date is off
        const isDateOff = (date) => {
            const checkDate = new Date(date);
            checkDate.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

            return timeOffRequests.some(req => {
                const reqStart = new Date(req.requestDate);
                reqStart.setHours(0, 0, 0, 0);
                const reqEnd = req.endDate ? new Date(req.endDate) : new Date(req.requestDate);
                reqEnd.setHours(23, 59, 59, 999);
                return checkDate >= reqStart && checkDate <= reqEnd;
            });
        };

        // Calculate week number
        const weekNumber = Math.ceil(
            (weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
        );

        // Generate PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${driver.personalId}-week-${weekNumber}.pdf"`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add logo (if exists)
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 80 });
        }

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('MYFLEET', 150, 57);
        doc.fontSize(10).font('Helvetica').text('Task & Shift Management', 150, 82);

        doc.fontSize(24).font('Helvetica-Bold').text('WEEKLY INVOICE', 50, 130);

        // Invoice details
        doc.fontSize(10).font('Helvetica');
        doc.text(`Invoice Number: INV-${new Date().getFullYear()}-W${weekNumber}-${driver.personalId}`, 50, 170);
        doc.text(`Issue Date: ${format(new Date(), 'dd MMMM yyyy', { locale: enGB })}`, 50, 185);
        doc.text(`Week: ${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy', { locale: enGB })}`, 50, 200);

        // Company info (right side)
        if (driver.company) {
            doc.text(driver.company.name, 350, 170, { align: 'right' });
            if (driver.company.address) {
                doc.fontSize(9).text(driver.company.address, 350, 185, { width: 200, align: 'right' });
            }
        }

        // Driver details section
        doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, 240);
        doc.fontSize(10).font('Helvetica');
        doc.text(`${driver.name}`, 50, 260);
        doc.text(`Driver ID: ${driver.personalId}`, 50, 275);
        if (driver.email) doc.text(`Email: ${driver.email}`, 50, 290);
        if (driver.phone) doc.text(`Phone: ${driver.phone}`, 50, 305);

        // Table header
        const tableTop = 350;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Day', 50, tableTop);
        doc.text('Date', 110, tableTop);
        doc.text('Route/Task', 180, tableTop);
        doc.text('Status', 380, tableTop);
        doc.text('Amount', 480, tableTop, { width: 80, align: 'right' });

        // Draw line under header
        doc.strokeColor('#4F46E5')
            .lineWidth(2)
            .moveTo(50, tableTop + 15)
            .lineTo(560, tableTop + 15)
            .stroke();

        // Table rows - ALL DAYS IN RANGE
        let yPosition = tableTop + 30;
        let totalAmount = 0;
        let daysWorked = 0;
        let daysOff = 0;

        doc.fontSize(9).font('Helvetica');

        weekDates.forEach(date => {
            // Check if we need a new page
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }

            const dayName = format(date, 'EEEE', { locale: enGB });
            const dateFormatted = format(date, 'dd/MM/yyyy');

            // Check if driver has time off this day
            const isOff = isDateOff(date);

            // Get tasks for this day using proper date comparison
            const dayTasks = tasks.filter(t => isSameDate(t.scheduledDate, date));

            const completedTasks = dayTasks.filter(t => t.status === 'COMPLETED');
            const dayEarnings = completedTasks.reduce((sum, t) => sum + (t.actualEarnings || t.price || 0), 0);

            if (isOff) {
                // Day off
                doc.fillColor('#9CA3AF');
                doc.text(dayName, 50, yPosition);
                doc.text(dateFormatted, 110, yPosition);
                doc.text('TIME OFF', 180, yPosition);
                doc.text('OFF', 380, yPosition);
                doc.text('£0.00', 480, yPosition, { width: 80, align: 'right' });
                doc.fillColor('#000000');
                daysOff++;
            } else if (dayTasks.length > 0) {
                // Worked this day
                const taskTitles = dayTasks.map(t => t.title).join(', ');
                const status = completedTasks.length === dayTasks.length ? 'COMPLETED' :
                    completedTasks.length > 0 ? `${completedTasks.length}/${dayTasks.length}` : 'PENDING';

                doc.text(dayName, 50, yPosition);
                doc.text(dateFormatted, 110, yPosition);
                doc.text(taskTitles.substring(0, 30) + (taskTitles.length > 30 ? '...' : ''), 180, yPosition, { width: 190 });
                doc.text(status, 380, yPosition);

                if (dayEarnings > 0) {
                    doc.fillColor('#059669');
                }
                doc.text(`£${dayEarnings.toFixed(2)}`, 480, yPosition, { width: 80, align: 'right' });
                doc.fillColor('#000000');

                totalAmount += dayEarnings;
                if (completedTasks.length > 0) daysWorked++;
            } else {
                // No tasks, no time off - idle day
                doc.fillColor('#9CA3AF');
                doc.text(dayName, 50, yPosition);
                doc.text(dateFormatted, 110, yPosition);
                doc.text('-', 180, yPosition);
                doc.text('NO TASKS', 380, yPosition);
                doc.text('£0.00', 480, yPosition, { width: 80, align: 'right' });
                doc.fillColor('#000000');
            }

            yPosition += 25;
        });

        // Total line
        yPosition += 10;
        doc.strokeColor('#000000')
            .lineWidth(1)
            .moveTo(50, yPosition)
            .lineTo(560, yPosition)
            .stroke();

        // Fetch active deductions for this period
        const deductions = await prisma.deduction.findMany({
            where: {
                userId: driverId,
                status: 'ACTIVE',
                startDate: {
                    lte: weekEnd
                },
                OR: [
                    { endDate: null },
                    { endDate: { gte: weekStart } }
                ]
            }
        });

        // Calculate applicable deductions
        const applicableDeductions = [];
        let totalDeductions = 0;

        for (const deduction of deductions) {
            let shouldApply = false;

            if (deduction.frequency === 'WEEKLY') {
                shouldApply = true;
            } else if (deduction.frequency === 'MONTHLY') {
                // Apply if it's the first week of the month
                const isFirstWeekOfMonth = weekStart.getDate() <= 7;
                shouldApply = isFirstWeekOfMonth;
            } else if (deduction.frequency === 'ONE_TIME' && !deduction.applied) {
                shouldApply = true;
            }

            if (shouldApply) {
                applicableDeductions.push(deduction);
                totalDeductions += deduction.amount;
            }
        }

        const netPay = totalAmount - totalDeductions;

        // Display earnings breakdown
        yPosition += 15;
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('GROSS EARNINGS:', 350, yPosition);
        doc.fillColor('#059669').font('Helvetica');
        doc.text(`£${totalAmount.toFixed(2)}`, 480, yPosition, { width: 80, align: 'right' });
        doc.fillColor('#000000');

        // Display deductions if any
        if (applicableDeductions.length > 0) {
            yPosition += 25;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('DEDUCTIONS:', 350, yPosition);

            yPosition += 15;
            doc.fontSize(9).font('Helvetica');

            applicableDeductions.forEach(deduction => {
                doc.fillColor('#666666');
                doc.text(`${deduction.description}`, 360, yPosition);
                doc.fillColor('#DC2626');
                doc.text(`-£${deduction.amount.toFixed(2)}`, 480, yPosition, { width: 80, align: 'right' });
                doc.fillColor('#000000');
                yPosition += 15;
            });

            yPosition += 5;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Total Deductions:', 350, yPosition);
            doc.fillColor('#DC2626');
            doc.text(`-£${totalDeductions.toFixed(2)}`, 480, yPosition, { width: 80, align: 'right' });
            doc.fillColor('#000000');

            // Separator line
            yPosition += 10;
            doc.strokeColor('#CCCCCC')
                .lineWidth(0.5)
                .moveTo(350, yPosition)
                .lineTo(560, yPosition)
                .stroke();
        }

        // NET PAY (final amount)
        yPosition += 15;
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('NET PAY:', 350, yPosition);
        doc.fillColor(netPay >= 0 ? '#059669' : '#DC2626');
        doc.fontSize(16);
        doc.text(`£${netPay.toFixed(2)}`, 480, yPosition, { width: 80, align: 'right' });
        doc.fillColor('#000000');

        // Summary
        yPosition += 30;
        doc.fontSize(10).font('Helvetica');
        doc.text(`Days Worked: ${daysWorked}`, 50, yPosition);
        doc.text(`Days Off: ${daysOff}`, 150, yPosition);
        doc.text(`Idle Days: ${weekDates.length - daysWorked - daysOff}`, 250, yPosition);

        // Payment terms
        yPosition += 30;
        doc.fontSize(9).font('Helvetica');
        doc.text('Payment Terms: Net 7 days', 50, yPosition);
        doc.text(`Due Date: ${format(addDays(weekEnd, 7), 'dd MMMM yyyy', { locale: enGB })}`, 50, yPosition + 15);

        // Footer
        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text('Thank you for your service!', 50, 750, { align: 'center', width: 500 });
        doc.text('MyFleet - Efficient Fleet Management', 50, 765, { align: 'center', width: 500 });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
};
