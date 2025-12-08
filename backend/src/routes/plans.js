import express from 'express';
import { getAllPlans, getPlan } from '../config/plans.js';

const router = express.Router();

/**
 * GET /api/plans
 * List all available subscription plans
 */
router.get('/', (req, res) => {
    try {
        const plans = getAllPlans();
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

/**
 * GET /api/plans/:planId
 * Get specific plan details
 */
router.get('/:planId', (req, res) => {
    try {
        const plan = getPlan(req.params.planId);

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.json(plan);
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
});

export default router;
