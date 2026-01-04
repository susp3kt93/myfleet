/**
 * Subscription Plan Configuration
 * Defines available plans with their limits and features
 */

export const PLANS = {
    FREE: {
        id: 'FREE',
        name: 'Free Plan',
        description: 'Perfect for small teams getting started',
        price: 0,
        currency: 'GBP',
        billingPeriod: 'month',
        limits: {
            maxDrivers: 5,
            maxVehicles: 5,
            maxTasks: 50  // per month
        },
        features: {
            basicReports: true,
            csvExport: false,
            pdfExport: false,
            analytics: false,
            notifications: false,
            maps: false,
            advancedReports: false,
            apiAccess: false
        }
    },
    BASIC: {
        id: 'BASIC',
        name: 'Basic Plan',
        description: 'Ideal for growing businesses',
        price: 29.99,
        currency: 'GBP',
        billingPeriod: 'month',
        limits: {
            maxDrivers: 20,
            maxVehicles: 20,
            maxTasks: 200  // per month
        },
        features: {
            basicReports: true,
            csvExport: true,
            pdfExport: true,
            analytics: false,
            notifications: true,
            maps: true,
            advancedReports: false,
            apiAccess: false
        }
    },
    PREMIUM: {
        id: 'PREMIUM',
        name: 'Premium Plan',
        description: 'For large-scale operations',
        price: 99.99,
        currency: 'GBP',
        billingPeriod: 'month',
        limits: {
            maxDrivers: 100,
            maxVehicles: 100,
            maxTasks: -1  // unlimited
        },
        features: {
            basicReports: true,
            csvExport: true,
            pdfExport: true,
            analytics: true,
            notifications: true,
            maps: true,
            advancedReports: true,
            apiAccess: true
        }
    }
};

/**
 * Get plan configuration by ID
 * @param {string} planId - Plan ID (FREE, BASIC, PREMIUM)
 * @returns {Object|null} Plan configuration or null if not found
 */
export const getPlan = (planId) => {
    return PLANS[planId] || null;
};

/**
 * Get all available plans
 * @returns {Array} Array of all plan configurations
 */
export const getAllPlans = () => {
    return Object.values(PLANS);
};

/**
 * Check if a plan exists
 * @param {string} planId - Plan ID to check
 * @returns {boolean} True if plan exists
 */
export const isValidPlan = (planId) => {
    return planId in PLANS;
};

/**
 * Get feature names by category
 */
export const FEATURE_CATEGORIES = {
    'Core Features': ['basicReports', 'notifications', 'maps'],
    'Exports': ['csvExport', 'pdfExport'],
    'Analytics': ['analytics', 'advancedReports'],
    'Integration': ['apiAccess']
};

/**
 * Get human-readable feature names
 */
export const FEATURE_NAMES = {
    basicReports: 'Basic Reports',
    csvExport: 'CSV Export',
    pdfExport: 'PDF Invoice Generation',
    analytics: 'Analytics Dashboard',
    notifications: 'Push Notifications',
    maps: 'Google Maps Integration',
    advancedReports: 'Advanced Reports',
    apiAccess: 'API Access'
};
