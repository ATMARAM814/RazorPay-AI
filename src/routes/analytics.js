import { Router } from 'express';
import { getComparison, getBreakdown } from '../controllers/analyticsController.js';

const router = Router();

// GET /api/analytics/comparison — System vs Naive baseline recovery comparison
router.get('/comparison', getComparison);

// GET /api/analytics/breakdown — Category & Action breakdown
router.get('/breakdown', getBreakdown);

export default router;
