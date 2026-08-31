import { supabase } from '../config/supabase.js';

// GET /api/audit/:transactionId — Full audit trail for a specific transaction
export const getAuditTrail = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Fetch transaction, recovery_action, and naive_baseline parallelly
    const [txnRes, recoveryRes, naiveRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('id', transactionId).maybeSingle(),
      supabase.from('recovery_actions').select('*').eq('transaction_id', transactionId).maybeSingle(),
      supabase.from('naive_baseline_actions').select('*').eq('transaction_id', transactionId).maybeSingle()
    ]);

    if (txnRes.error) {
      return res.status(500).json({ error: `Transaction query error: ${txnRes.error.message}` });
    }

    const transaction = txnRes.data;
    if (!transaction) {
      return res.status(404).json({ error: `Transaction with ID '${transactionId}' not found` });
    }

    const recoveryAction = recoveryRes.data || null;
    const naiveBaseline = naiveRes.data || null;

    // Construct structured timeline events
    const timeline = [];

    // Event 1: Initial Payment Attempt/Failure
    timeline.push({
      step: 1,
      event: 'PAYMENT_FAILED',
      timestamp: transaction.created_at || new Date().toISOString(),
      title: 'Payment Failed',
      description: `Payment of INR ${(transaction.amount / 100).toFixed(2)} via ${transaction.method.toUpperCase()} failed. Reason: ${transaction.error_reason} (Source: ${transaction.error_source || 'N/A'}).`,
      details: {
        amount: transaction.amount,
        method: transaction.method,
        error_code: transaction.error_code,
        error_reason: transaction.error_reason,
        error_source: transaction.error_source,
        attempt_number: transaction.attempt_number || 1
      }
    });

    // Event 2: AI Intervention & Diagnostic Decision
    if (recoveryAction) {
      timeline.push({
        step: 2,
        event: 'DIAGNOSTIC_INTERVENTION',
        timestamp: recoveryAction.created_at || transaction.created_at,
        title: 'AI Revenue Engine Intervention',
        description: `Classified as '${recoveryAction.predicted_category}' with ${(recoveryAction.confidence_score * 100).toFixed(0)}% confidence. Action: '${recoveryAction.action_taken}'.`,
        details: {
          predicted_category: recoveryAction.predicted_category,
          confidence_score: recoveryAction.confidence_score,
          action_taken: recoveryAction.action_taken,
          reasoning: recoveryAction.reasoning,
          scheduled_retry_at: recoveryAction.scheduled_retry_at
        }
      });

      // Event 3: Scheduled Intervention / Execution Outcome
      if (recoveryAction.outcome || recoveryAction.scheduled_retry_at || recoveryAction.action_taken) {
        timeline.push({
          step: 3,
          event: 'RECOVERY_OUTCOME',
          timestamp: recoveryAction.scheduled_retry_at || recoveryAction.created_at,
          title: recoveryAction.outcome === 'recovered' ? 'Revenue Recovered' : 'Recovery Execution Status',
          description: recoveryAction.outcome
            ? `Final outcome: ${recoveryAction.outcome.toUpperCase()}`
            : recoveryAction.scheduled_retry_at
              ? `Retry scheduled for ${new Date(recoveryAction.scheduled_retry_at).toLocaleString()}`
              : `Action executed: ${recoveryAction.action_taken}`,
          details: {
            outcome: recoveryAction.outcome,
            scheduled_retry_at: recoveryAction.scheduled_retry_at
          }
        });
      }
    }

    return res.status(200).json({
      data: {
        transaction_id: transaction.id,
        customer_id: transaction.customer_id,
        transaction,
        recovery_action: recoveryAction ? {
          predicted_category: recoveryAction.predicted_category,
          confidence_score: recoveryAction.confidence_score,
          action_taken: recoveryAction.action_taken,
          reasoning: recoveryAction.reasoning,
          scheduled_retry_at: recoveryAction.scheduled_retry_at,
          outcome: recoveryAction.outcome,
          created_at: recoveryAction.created_at
        } : null,
        naive_baseline: naiveBaseline ? {
          action_taken: naiveBaseline.action_taken,
          scheduled_retry_at: naiveBaseline.scheduled_retry_at,
          outcome: naiveBaseline.outcome
        } : null,
        timeline
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
