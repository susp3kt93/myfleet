import { PrismaClient } from '@prisma/client';
import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// CSV Export for Company Admins
export const generateWeeklyCSV = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        // Get company filter from middleware
        const companyFilter = req.companyFilter || {};

        // Fetch tasks for the week
        const tasks = await prisma.task.findMany({
            where: {
                ...companyFilter,
                scheduledDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
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

        // Format data for CSV
        const csvData = tasks.map(task => ({
            'Driver Name': task.assignedTo?.name || 'Unassigned',
            'Personal ID': task.assignedTo?.personalId || '-',
            'Route/Task': task.title,
            'Date': format(new Date(task.scheduledDate), 'yyyy-MM-dd'),
            'Location': task.location || '-',
            'Earnings (RON)': task.actualEarnings || task.price || 0,
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
            'Location': '',
            'Earnings (RON)': totalEarnings,
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
                'Location',
                'Earnings (RON)',
                'Status',
                'Time'
            ]
        });

        // Set headers for download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${startDate}.csv"`);
        res.send(csv);

    } catch (error) {
        console.error('CSV generation error:', error);
        res.status(500).json({ error: 'Failed to generate CSV report' });
    }
};

// PDF Invoice Export for Drivers
export const generateDriverInvoice = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const driverId = req.user.id; // Current logged-in driver

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

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

        // Fetch completed tasks for the week
        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: driverId,
                scheduledDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                },
                status: 'COMPLETED'
            },
            orderBy: { scheduledDate: 'asc' }
        });

        // Calculate week number
        const weekStart = new Date(startDate);
        const weekNumber = Math.ceil(
            (weekStart - new Date(weekStart.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)
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
        doc.text(`Issue Date: ${format(new Date(), 'MMMM dd, yyyy')}`, 50, 185);
        doc.text(`Period: ${format(new Date(startDate), 'MMM dd')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`, 50, 200);

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
        doc.text('Date', 50, tableTop);
        doc.text('Route', 120, tableTop);
        doc.text('Location', 300, tableTop);
        doc.text('Amount', 480, tableTop, { width: 80, align: 'right' });

        // Draw line under header
        doc.strokeColor('#4F46E5')
            .lineWidth(2)
            .moveTo(50, tableTop + 15)
            .lineTo(560, tableTop + 15)
            .stroke();

        // Table rows
        let yPosition = tableTop + 30;
        let totalAmount = 0;

        doc.fontSize(9).font('Helvetica');

        tasks.forEach(task => {
            const amount = task.actualEarnings || task.price || 0;
            totalAmount += amount;

            // Check if we need a new page
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }

            doc.text(format(new Date(task.scheduledDate), 'MMM dd'), 50, yPosition);
            doc.text(task.title, 120, yPosition, { width: 170 });
            doc.text(task.location || '-', 300, yPosition, { width: 170 });
            doc.text(`${amount.toFixed(2)} RON`, 480, yPosition, { width: 80, align: 'right' });

            yPosition += 25;
        });

        // Total line
        yPosition += 10;
        doc.strokeColor('#000000')
            .lineWidth(1)
            .moveTo(50, yPosition)
            .lineTo(560, yPosition)
            .stroke();

        yPosition += 15;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('TOTAL EARNINGS:', 350, yPosition);
        doc.text(`${totalAmount.toFixed(2)} RON`, 480, yPosition, { width: 80, align: 'right' });

        // Payment terms
        yPosition += 40;
        doc.fontSize(9).font('Helvetica');
        doc.text('Payment Terms: Net 7 days', 50, yPosition);
        doc.text(`Due Date: ${format(new Date(new Date(endDate).getTime() + 7 * 24 * 60 * 60 * 1000), 'MMMM dd, yyyy')}`, 50, yPosition + 15);

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
