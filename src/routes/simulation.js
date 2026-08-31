import express from 'express';
import { simulateLivePayment } from '../controllers/simulationController.js';

const router = express.Router();

// POST /api/simulate-live
router.post('/', simulateLivePayment);

export default router;
