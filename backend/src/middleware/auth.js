import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                personalId: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                photoUrl: true,
                isActive: true,
                companyId: true  // Add company context for multi-tenant
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid token or user inactive' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('[Auth Middleware] Error:', error.message, error.name);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        console.error('[Auth Middleware] Unexpected error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

export const requireAdmin = (req, res, next) => {
    // Accept both SUPER_ADMIN and COMPANY_ADMIN
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'COMPANY_ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
