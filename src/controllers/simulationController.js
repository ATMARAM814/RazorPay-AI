import { supabase } from '../config/supabase.js';

// Helper for weighted random choice
const getRandomWeighted = (options) => {
  const rand = Math.random();
  let cumulative = 0;
  for (const opt of options) {
    cumulative += opt.weight;
    if (rand <= cumulative) return opt.value;
  }
  return options[options.length - 1].value;
};

// Helper for random choice from array
const getRandomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper for random integer in range [min, max]
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to shuffle an array
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// POST /api/simulate-live — Generate 10 live payments per click (6-7 failed, 3-4 captured)
export const simulateLivePayment = async (req, res) => {
  try {
    // 1. Fetch existing customer profiles to reuse real customer history
    const { data: customers, error: customerErr } = await supabase
      .from('customer_profiles')
      .select('*')
      .limit(100);

    if (customerErr || !customers || customers.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch customer profiles for simulation' });
    }

    // 2. Decide counts: 6-7 failed, 3-4 captured (total = 10)
    const numFailed = getRandomChoice([6, 7]);
    const numCaptured = 10 - numFailed;

    const specs = [
      ...Array(numFailed).fill('failed'),
      ...Array(numCaptured).fill('captured')
    ];
    const shuffledSpecs = shuffleArray(specs);

    const generatedItems = [];
    const baseTime = Date.now();

    // Generate 10 transactions sequentially with staggered timestamps
    for (let i = 0; i < 10; i++) {
      const isFailedSpec = shuffledSpecs[i] === 'failed';
      const customer = getRandomChoice(customers);
      const customerId = customer.customer_id;
      const amount = getRandomInt(4900, 99900); // ₹49.00 to ₹999.00 in paise

      // Method weights: upi 58%, card 27%, netbanking 15%
      const method = getRandomWeighted([
        { value: 'upi', weight: 0.58 },
        { value: 'card', weight: 0.27 },
        { value: 'netbanking', weight: 0.15 }
      ]);

      const bankCode = getRandomChoice(['HDFC', 'ICIC', 'SBIN', 'AXIS', 'KKBK', 'UTIB']);
      const cardNetwork = method === 'card' ? getRandomChoice(['visa', 'mastercard', 'rupay']) : null;
      const timestamp = new Date(baseTime + (10 - i) * 1000).toISOString();

      if (!isFailedSpec) {
        // === SUCCESSFUL / CAPTURED TRANSACTION (No diagnosis needed) ===
        const newTxnPayload = {
          customer_id: customerId,
          amount,
          method,
          bank_code: bankCode,
          card_network: cardNetwork,
          error_reason: null,
          error_source: null,
          mandate_status: 'active',
          attempt_number: 1,
          status: 'captured',
          created_at: timestamp
        };

        const { data: insertedTxn, error: txnErr } = await supabase
          .from('transactions')
          .insert([newTxnPayload])
          .select()
          .single();

        if (!txnErr && insertedTxn) {
          const actionResult = {
            id: `cap_${insertedTxn.id}`,
            transaction_id: insertedTxn.id,
            predicted_category: 'none',
            action_taken: 'none',
            confidence_score: 1.0,
            reasoning: 'Payment captured successfully on initial attempt. No recovery intervention needed.',
            outcome: 'captured',
            created_at: timestamp,
            is_live_demo: true,
            transactions: {
              ...insertedTxn,
              is_live_demo: true
            }
          };

          generatedItems.push(actionResult);
        }
      } else {
        // === FAILED TRANSACTION (Diagnose -> Decide -> Recovery Action) ===
        // STRICT METHOD-TO-ERROR_REASON MAPPING:
        // upi: ONLY insufficient_funds, mandate_revoked, generic_decline (NO card_expired/card_blocked!)
        // card: card_expired, card_blocked, insufficient_funds, generic_decline
        // netbanking: insufficient_funds, generic_decline
        let errorReasonOptions = [];
        if (method === 'upi') {
          errorReasonOptions = [
            { value: 'insufficient_funds', weight: 0.50 },
            { value: 'mandate_revoked', weight: 0.25 },
            { value: 'generic_decline', weight: 0.25 }
          ];
        } else if (method === 'card') {
          errorReasonOptions = [
            { value: 'card_expired', weight: 0.35 },
            { value: 'card_blocked', weight: 0.35 },
            { value: 'insufficient_funds', weight: 0.15 },
            { value: 'generic_decline', weight: 0.15 }
          ];
        } else {
          errorReasonOptions = [
            { value: 'insufficient_funds', weight: 0.60 },
            { value: 'generic_decline', weight: 0.40 }
          ];
        }

        const errorReason = getRandomWeighted(errorReasonOptions);

        let errorSource = 'customer';
        if (errorReason === 'card_blocked') errorSource = 'bank';
        else if (errorReason === 'generic_decline') errorSource = 'network';

        const mandateStatus = errorReason === 'mandate_revoked' ? 'revoked' : 'active';
        const attemptNumber = method === 'upi' ? getRandomInt(1, 4) : getRandomInt(1, 3);

        const newTxnPayload = {
          customer_id: customerId,
          amount,
          method,
          bank_code: bankCode,
          card_network: cardNetwork,
          error_reason: errorReason,
          error_source: errorSource,
          mandate_status: mandateStatus,
          attempt_number: attemptNumber,
          status: 'failed',
          created_at: timestamp
        };

        const { data: insertedTxn, error: txnErr } = await supabase
          .from('transactions')
          .insert([newTxnPayload])
          .select()
          .single();

        if (!txnErr && insertedTxn) {
          // Decision Engine logic
          let predictedCategory = errorReason;
          let actionTaken = 'retry_now';
          let confidenceScore = 0.85;
          let reasoning = 'Standard transient retry scheduled.';

          if (errorReason === 'mandate_revoked') {
            actionTaken = 'prompt_restore_mandate';
            confidenceScore = 0.28;
            reasoning = 'Mandate revoked by customer. Sent warm SMS/WhatsApp message encouraging customer to restore mandate to continue service without disruption. Zero charge retries executed.';
          } else if (errorReason === 'card_expired') {
            actionTaken = 'prompt_update_card';
            confidenceScore = 0.48;
            reasoning = 'Card expired. Prompted customer to update card details. Auto-retry scheduled after 84 hours.';
          } else if (errorReason === 'card_blocked') {
            actionTaken = 'prompt_update_payment_method';
            confidenceScore = 0.38;
            reasoning = 'Card blocked by issuing bank. Prompted customer via SMS/Email to switch payment method. Auto-retry scheduled after 84 hours.';
          } else if (errorReason === 'insufficient_funds') {
            actionTaken = 'retry_delayed';
            confidenceScore = 0.78;
            const payday = customer.typical_failure_day_of_month || 1;
            reasoning = `Insufficient funds. Delaying retry to customer's salary window (around day ${payday} of month).`;
          } else if (errorReason === 'generic_decline') {
            actionTaken = 'retry_now';
            confidenceScore = 0.85;
            reasoning = 'Transient network decline. Retrying within 2 hours for fast infrastructure recovery.';
          }

          // NPCI Rule: UPI attempt ceiling cap check
          if (method === 'upi' && attemptNumber >= 4) {
            actionTaken = 'stop_max_attempts_reached';
            confidenceScore = 1.00;
            reasoning = 'NPCI UPI 4-attempt hard cap reached. Halting further retries.';
          }

          // Outcome simulation
          let outcome = null;
          if (actionTaken === 'stop_max_attempts_reached' || actionTaken === 'no_action_respect_revoke') {
            outcome = 'not_recovered';
          } else if (actionTaken === 'prompt_restore_mandate') {
            outcome = null;
          } else if (actionTaken === 'retry_now') {
            outcome = Math.random() <= 0.85 ? 'recovered' : 'not_recovered';
          } else {
            outcome = null;
          }

          const newActionPayload = {
            transaction_id: insertedTxn.id,
            predicted_category: predictedCategory,
            action_taken: actionTaken,
            confidence_score: confidenceScore,
            reasoning,
            outcome,
            created_at: new Date(new Date(timestamp).getTime() + 5000).toISOString()
          };

          const { data: insertedAction } = await supabase
            .from('recovery_actions')
            .insert([newActionPayload])
            .select()
            .single();

          if (insertedAction) {
            generatedItems.push({
              ...insertedAction,
              is_live_demo: true,
              transactions: {
                ...insertedTxn,
                is_live_demo: true
              }
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: generatedItems
    });
  } catch (err) {
    console.error('Error in simulateLivePayment:', err);
    return res.status(500).json({ error: err.message || 'Internal simulation error' });
  }
};
