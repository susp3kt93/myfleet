import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Login
router.post('/login', async (req, res) => {
    try {
        const { personalId, password } = req.body;
        console.log('[Auth] Login attempt for:', personalId);

        if (!personalId || !password) {
            console.log('[Auth] Missing credentials');
            return res.status(400).json({ error: 'Personal ID and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { personalId }
        });

        console.log('[Auth] User found:', user ? 'yes' : 'no');

        if (!user || !user.isActive) {
            console.log('[Auth] User not found or inactive');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('[Auth] Password valid:', isValidPassword);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                personalId: user.personalId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                photoUrl: user.photoUrl,
                companyId: user.companyId
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    res.json({ user: req.user });
});

// Logout (client-side token removal, but endpoint for consistency)
router.post('/logout', authenticate, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Register/Update push token
router.post('/push-token', authenticate, async (req, res) => {
    try {
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({
                success: false,
                error: 'Push token is required'
            });
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: { pushToken },
        });

        res.json({
            success: true,
            message: 'Push token registered successfully',
        });
    } catch (error) {
        console.error('Push token registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register push token'
        });
    }
});

export default router;
