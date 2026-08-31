import { Router } from 'express';
import { getAuditTrail } from '../controllers/auditController.js';

const router = Router();

// GET /api/audit/:transactionId — Full audit trail and timeline for a transaction
router.get('/:transactionId', getAuditTrail);

export default router;
