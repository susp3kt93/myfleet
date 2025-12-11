import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import driverRoutes from './routes/driver.js';
import messageRoutes from './routes/messages.js';
import reportsRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import companyRoutes from './routes/companies.js';
import plansRoutes from './routes/plans.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
    origin: corsOrigin === '*' ? true : (corsOrigin?.split(',') || true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/plans', plansRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 MyFleet API server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
