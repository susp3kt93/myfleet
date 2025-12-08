// Permission Middleware for Multi-Tenant Access Control
import prisma from '../utils/prisma.js';

/**
 * Check if user is SUPER_ADMIN
 */
const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            error: 'Access denied. Super Admin privileges required.'
        });
    }
    next();
};

/**
 * Check if user is COMPANY_ADMIN or SUPER_ADMIN
 */
const requireCompanyAdmin = (req, res, next) => {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'COMPANY_ADMIN') {
        return res.status(403).json({
            error: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

/**
 * Check if user can access specific company data
 * SUPER_ADMIN: can access any company
 * COMPANY_ADMIN: can only access their own company
 * DRIVER: can only access their own company
 */
const requireCompanyAccess = (companyIdParam = 'companyId') => {
    return async (req, res, next) => {
        // SUPER_ADMIN can access everything
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        // Get company ID from request (params, body, or query)
        const requestedCompanyId = req.params[companyIdParam] ||
            req.body.companyId ||
            req.query.companyId;

        // If no company specified, use user's company
        if (!requestedCompanyId) {
            req.companyId = req.user.companyId;
            return next();
        }

        // Check if user's company matches requested company
        if (req.user.companyId !== requestedCompanyId) {
            return res.status(403).json({
                error: 'Access denied. You can only access your own company data.'
            });
        }

        req.companyId = requestedCompanyId;
        next();
    };
};

/**
 * Ensure user belongs to a company (not SUPER_ADMIN)
 */
const requireCompanyMembership = (req, res, next) => {
    if (!req.user.companyId) {
        return res.status(400).json({
            error: 'This operation requires company membership.'
        });
    }
    next();
};

/**
 * Check if user can manage a specific company
 * SUPER_ADMIN: can manage any company
 * COMPANY_ADMIN: can only manage their own company
 */
const canManageCompany = async (req, res, next) => {
    const companyId = req.params.id || req.params.companyId;

    // SUPER_ADMIN can manage any company
    if (req.user.role === 'SUPER_ADMIN') {
        return next();
    }

    // COMPANY_ADMIN can only manage their own company
    if (req.user.role === 'COMPANY_ADMIN' && req.user.companyId === companyId) {
        return next();
    }

    return res.status(403).json({
        error: 'Access denied. You cannot manage this company.'
    });
};

/**
 * Filter query by company for non-SUPER_ADMIN users
 * Automatically adds company filter to Prisma queries
 */
const addCompanyFilter = (req, res, next) => {
    // SUPER_ADMIN sees all data
    if (req.user.role === 'SUPER_ADMIN') {
        req.companyFilter = {};
    } else {
        // Others only see their company data
        req.companyFilter = { companyId: req.user.companyId };
    }
    next();
};

/**
 * Check if company can create more drivers based on plan limits
 */
const checkDriverLimit = async (req, res, next) => {
    try {
        // SUPER_ADMIN bypass
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        // Only check when creating a driver
        if (req.body.role !== 'DRIVER') {
            return next();
        }

        const company = await prisma.company.findUnique({
            where: { id: req.user.companyId },
            select: {
                plan: true,
                maxDrivers: true,
                _count: {
                    select: { users: true }
                }
            }
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const currentDriverCount = company._count.users;
        const limit = company.maxDrivers;

        if (currentDriverCount >= limit) {
            return res.status(403).json({
                error: `Driver limit reached for ${company.plan} plan (${limit} maximum). Please upgrade your plan or remove inactive drivers.`,
                currentCount: currentDriverCount,
                limit: limit,
                plan: company.plan
            });
        }

        next();
    } catch (error) {
        console.error('Error checking driver limit:', error);
        res.status(500).json({ error: 'Failed to check driver limit' });
    }
};

/**
 * Check if company can create more vehicles based on plan limits
 */
const checkVehicleLimit = async (req, res, next) => {
    try {
        // SUPER_ADMIN bypass
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        const company = await prisma.company.findUnique({
            where: { id: req.user.companyId },
            select: {
                plan: true,
                maxVehicles: true,
                _count: {
                    select: { vehicles: true }
                }
            }
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const currentVehicleCount = company._count.vehicles;
        const limit = company.maxVehicles;

        if (currentVehicleCount >= limit) {
            return res.status(403).json({
                error: `Vehicle limit reached for ${company.plan} plan (${limit} maximum). Please upgrade your plan or remove inactive vehicles.`,
                currentCount: currentVehicleCount,
                limit: limit,
                plan: company.plan
            });
        }

        next();
    } catch (error) {
        console.error('Error checking vehicle limit:', error);
        res.status(500).json({ error: 'Failed to check vehicle limit' });
    }
};

/**
 * Middleware factory to check if company has access to a specific feature
 * @param {string} featureName - Name of the feature to check (e.g., 'csvExport', 'pdfExport')
 */
const requireFeature = (featureName) => {
    return async (req, res, next) => {
        try {
            // SUPER_ADMIN has access to all features
            if (req.user.role === 'SUPER_ADMIN') {
                return next();
            }

            const company = await prisma.company.findUnique({
                where: { id: req.user.companyId },
                select: { plan: true }
            });

            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            // Dynamically import plans config
            const { getPlan } = await import('../config/plans.js');
            const planConfig = getPlan(company.plan);

            if (!planConfig) {
                return res.status(500).json({ error: 'Invalid plan configuration' });
            }

            if (!planConfig.features[featureName]) {
                return res.status(403).json({
                    error: `This feature is not available on your ${company.plan} plan. Please upgrade to access ${featureName}.`,
                    plan: company.plan,
                    feature: featureName,
                    upgradeRequired: true
                });
            }

            next();
        } catch (error) {
            console.error('Error checking feature access:', error);
            res.status(500).json({ error: 'Failed to check feature access' });
        }
    };
};

export {
    requireSuperAdmin,
    requireCompanyAdmin,
    requireCompanyAccess,
    requireCompanyMembership,
    canManageCompany,
    addCompanyFilter,
    checkDriverLimit,
    checkVehicleLimit,
    requireFeature
};
