import { Router } from 'express';
import {
  getAllRecoveryActions,
  getRecoveryActionsByCategory,
  getRecoveryActionByTransactionId
} from '../controllers/recoveryController.js';
import {
  executeDueActions,
  executeSingleAction
} from '../controllers/executionController.js';

const router = Router();

// POST /api/recovery-actions/execute-due — Batch execute all scheduled/pending actions
router.post('/execute-due', executeDueActions);

// GET /api/recovery-actions — All recovery actions joined with transaction details
router.get('/', getAllRecoveryActions);

// GET /api/recovery-actions/category/:category — Filtered by predicted_category
router.get('/category/:category', getRecoveryActionsByCategory);

// POST /api/recovery-actions/:id/execute — Execute single recovery action
router.post('/:id/execute', executeSingleAction);

// GET /api/recovery-actions/:transactionId — Single recovery action by transaction_id
router.get('/:transactionId', getRecoveryActionByTransactionId);

export default router;
