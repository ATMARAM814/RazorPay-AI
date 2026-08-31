import { Router } from 'express';
import {
  getAllTransactions,
  getFailedTransactions,
  getTransactionById
} from '../controllers/transactionsController.js';

const router = Router();

// GET /api/transactions — All transactions with optional filters (status, method, error_reason)
router.get('/', getAllTransactions);

// GET /api/transactions/failed — Shortcut for failed transactions
// Note: Placed before /:id to prevent matching 'failed' as an id parameter
router.get('/failed', getFailedTransactions);

// GET /api/transactions/:id — Single transaction by id
router.get('/:id', getTransactionById);

export default router;
