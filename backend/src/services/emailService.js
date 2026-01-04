// Email Service using Nodemailer
import nodemailer from 'nodemailer';

// Create transporter (configure with your email service)
const createTransporter = () => {
    // For Gmail, you need to enable "Less secure apps" or use App Password
    // For production, use SendGrid, Mailgun, or similar
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Email Templates
const templates = {
    taskAssigned: (driverName, taskTitle, taskDate, taskLocation) => ({
        subject: `🚛 New Task Assigned: ${taskTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🚛 MyFleet</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #1f2937; margin-top: 0;">Hello, ${driverName}!</h2>
                    <p style="color: #4b5563; font-size: 16px;">A new task has been assigned to you:</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 10px 0;">📋 ${taskTitle}</h3>
                        <p style="color: #6b7280; margin: 5px 0;"><strong>📅 Date:</strong> ${taskDate}</p>
                        ${taskLocation ? `<p style="color: #6b7280; margin: 5px 0;"><strong>📍 Location:</strong> ${taskLocation}</p>` : ''}
                    </div>
                    
                    <p style="color: #4b5563;">Please check the app for more details and to accept or complete this task.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #9ca3af; font-size: 12px;">This is an automated message from MyFleet.</p>
                    </div>
                </div>
            </div>
        `
    }),

    timeOffApproved: (driverName, startDate, endDate) => ({
        subject: '✅ Time Off Request Approved',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🚛 MyFleet</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #1f2937; margin-top: 0;">Hello, ${driverName}!</h2>
                    <p style="color: #4b5563; font-size: 16px;">Great news! Your time off request has been <strong style="color: #22c55e;">approved</strong>.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 10px 0;">🏖️ Approved Time Off</h3>
                        <p style="color: #6b7280; margin: 5px 0;"><strong>📅 Period:</strong> ${startDate}${endDate ? ` → ${endDate}` : ''}</p>
                    </div>
                    
                    <p style="color: #4b5563;">Enjoy your time off!</p>
                </div>
            </div>
        `
    }),

    timeOffRejected: (driverName, startDate, endDate, reason) => ({
        subject: '❌ Time Off Request Rejected',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🚛 MyFleet</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #1f2937; margin-top: 0;">Hello, ${driverName}!</h2>
                    <p style="color: #4b5563; font-size: 16px;">Unfortunately, your time off request has been <strong style="color: #ef4444;">rejected</strong>.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 10px 0;">📅 Requested Period</h3>
                        <p style="color: #6b7280; margin: 5px 0;">${startDate}${endDate ? ` → ${endDate}` : ''}</p>
                        ${reason ? `<p style="color: #6b7280; margin: 10px 0 0 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
                    </div>
                    
                    <p style="color: #4b5563;">Please contact your administrator if you have questions.</p>
                </div>
            </div>
        `
    })
};

// Send email function
export const sendEmail = async (to, template, data) => {
    try {
        // Check if email is configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('[Email] SMTP not configured, skipping email send');
            return { success: false, reason: 'SMTP not configured' };
        }

        const transporter = createTransporter();
        const emailContent = templates[template](...data);

        const mailOptions = {
            from: `"MyFleet" <${process.env.SMTP_USER}>`,
            to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email] Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Specific email functions
export const sendTaskAssignedEmail = async (driverEmail, driverName, taskTitle, taskDate, taskLocation) => {
    return sendEmail(driverEmail, 'taskAssigned', [driverName, taskTitle, taskDate, taskLocation]);
};

export const sendTimeOffApprovedEmail = async (driverEmail, driverName, startDate, endDate) => {
    return sendEmail(driverEmail, 'timeOffApproved', [driverName, startDate, endDate]);
};

export const sendTimeOffRejectedEmail = async (driverEmail, driverName, startDate, endDate, reason) => {
    return sendEmail(driverEmail, 'timeOffRejected', [driverName, startDate, endDate, reason]);
};

export default {
    sendEmail,
    sendTaskAssignedEmail,
    sendTimeOffApprovedEmail,
    sendTimeOffRejectedEmail
};
