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

    // 1. Calculate strict chronological timestamps relative to transaction creation (t1 < t2 < t3)
    const t1 = new Date(transaction.created_at || '2026-08-25T10:00:00Z');
    const t2 = new Date(t1.getTime() + 60 * 1000); // AI diagnosis 1 minute after failure

    const actionTaken = recoveryAction ? recoveryAction.action_taken : 'retry_now';
    const isRecovered = recoveryAction?.outcome === 'recovered';
    const isHalted = 
      actionTaken === 'no_action_respect_revoke' || 
      actionTaken === 'stop_max_attempts_reached';

    // 2. Calculate Attempts Used & Retries Remaining
    let attemptsUsed = transaction.attempt_number || 1;
    if (isRecovered) {
      attemptsUsed = 2; // 1 Initial Failure + 1 Successful AI Retry
    }
    const maxAttemptsAllowed = 4; // NPCI UPI Hard Cap
    let retriesRemaining = (isRecovered || isHalted) ? 0 : Math.max(0, maxAttemptsAllowed - attemptsUsed);

    // Compute next retry timestamp relative to t1 ONLY if active pending retries exist
    let t3 = null;
    let nextRetryISO = null;

    if (!isRecovered && !isHalted) {
      let delayHours = 24;
      if (actionTaken === 'retry_delayed') delayHours = 72; // 3 days (payday window alignment)
      else if (actionTaken === 'retry_now') delayHours = 2; // 2 hours (transient network recovery)
      else if (actionTaken === 'prompt_update_card') delayHours = 24; // 1 day

      t3 = new Date(t1.getTime() + delayHours * 3600 * 1000);
      nextRetryISO = t3.toISOString();
    } else if (isRecovered) {
      t3 = new Date(t1.getTime() + 24 * 3600 * 1000); // Recovery executed 1 day after failure
    }

    let retryStrategyWindow = 'Standard Spaced Window (~24h)';
    if (actionTaken === 'retry_delayed') {
      retryStrategyWindow = 'Payday Salary Window (1st - 5th of Month)';
    } else if (actionTaken === 'retry_now') {
      retryStrategyWindow = 'Fast Infrastructure Recovery Window (~2 Hours)';
    } else if (actionTaken === 'prompt_update_card') {
      retryStrategyWindow = 'Customer Method Update Link Prompt';
    } else if (actionTaken === 'no_action_respect_revoke') {
      retryStrategyWindow = 'Zero Retries (Customer Mandate Revoked — Compliant Restraint)';
    } else if (actionTaken === 'stop_max_attempts_reached') {
      retryStrategyWindow = 'Zero Retries (NPCI 4-Attempt Ceiling Reached)';
    }

    // 3. Construct structured timeline events in strict chronological order
    const timeline = [];

    // Event 1: Initial Payment Attempt/Failure
    timeline.push({
      step: 1,
      event: 'PAYMENT_FAILED',
      timestamp: t1.toISOString(),
      title: 'Initial Payment Attempt Failed',
      description: `Attempt 1 of 4 failed: INR ${(transaction.amount / 100).toFixed(2)} via ${transaction.method.toUpperCase()} failed. Reason: ${transaction.error_reason} (Source: ${transaction.error_source || 'N/A'}).`,
      details: {
        amount: transaction.amount,
        method: transaction.method,
        error_code: transaction.error_code,
        error_reason: transaction.error_reason,
        error_source: transaction.error_source,
        attempts_used: 1
      }
    });

    // Event 2: AI Intervention & Diagnostic Decision
    if (recoveryAction) {
      const confPct = Math.round((recoveryAction.confidence_score || 0.95) * 100);
      timeline.push({
        step: 2,
        event: 'DIAGNOSTIC_INTERVENTION',
        timestamp: t2.toISOString(),
        title: 'AI Revenue Engine Intervention',
        description: `Diagnosed as '${recoveryAction.predicted_category}' with ${confPct}% confidence. Action decided: '${recoveryAction.action_taken}'.`,
        details: {
          predicted_category: recoveryAction.predicted_category,
          confidence_score: recoveryAction.confidence_score,
          action_taken: recoveryAction.action_taken,
          reasoning: recoveryAction.reasoning,
          retries_remaining: retriesRemaining,
          next_retry_scheduled_at: nextRetryISO,
          retry_strategy_window: retryStrategyWindow
        }
      });

      // Event 3: Scheduled Intervention / Execution Outcome
      timeline.push({
        step: 3,
        event: 'RECOVERY_OUTCOME',
        timestamp: t3 ? t3.toISOString() : t2.toISOString(),
        title: isRecovered ? 'Revenue Recovered (Attempt 2 of 4)' : 'Recovery Execution Status',
        description: isRecovered
          ? `AI Intervention Retry Succeeded: INR ${(transaction.amount / 100).toFixed(2)} recovered.`
          : isHalted
            ? `Execution Status: HALTED (${retryStrategyWindow})`
            : `Next retry scheduled for ${t3 ? t3.toLocaleString() : 'N/A'} (${retryStrategyWindow})`,
        details: {
          outcome: recoveryAction.outcome || 'pending_execution',
          scheduled_retry_at: nextRetryISO,
          retries_remaining: retriesRemaining,
          next_retry_scheduled_at: nextRetryISO
        }
      });
    }

    return res.status(200).json({
      data: {
        transaction_id: transaction.id,
        customer_id: transaction.customer_id,
        transaction,
        retry_schedule_summary: {
          attempts_used: attemptsUsed,
          max_attempts_allowed: maxAttemptsAllowed,
          retries_remaining: retriesRemaining,
          next_retry_scheduled_at: nextRetryISO,
          retry_strategy_window: retryStrategyWindow,
          is_recovered: isRecovered,
          is_halted: isHalted
        },
        recovery_action: recoveryAction ? {
          predicted_category: recoveryAction.predicted_category,
          confidence_score: recoveryAction.confidence_score,
          action_taken: recoveryAction.action_taken,
          reasoning: recoveryAction.reasoning,
          scheduled_retry_at: nextRetryISO,
          outcome: recoveryAction.outcome,
          created_at: t2.toISOString()
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
