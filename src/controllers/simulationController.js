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

// POST /api/simulate-live — Generate a single live failed payment & simulate AI recovery
export const simulateLivePayment = async (req, res) => {
  try {
    // 1. Pick 1 random existing customer from customer_profiles to reuse real history
    const { data: customers, error: customerErr } = await supabase
      .from('customer_profiles')
      .select('*')
      .limit(50);

    if (customerErr || !customers || customers.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch customer profiles for simulation' });
    }

    const customer = getRandomChoice(customers);
    const customerId = customer.customer_id;

    // 2. Generate random failed transaction attributes
    const amount = getRandomInt(4900, 99900); // Amount in paise (₹49.00 to ₹999.00)
    
    // Method weights: upi 58%, card 27%, netbanking 15%
    const method = getRandomWeighted([
      { value: 'upi', weight: 0.58 },
      { value: 'card', weight: 0.27 },
      { value: 'netbanking', weight: 0.15 }
    ]);

    const bankCode = getRandomChoice(['HDFC', 'ICIC', 'SBIN', 'AXIS', 'KKBK', 'UTIB']);
    const cardNetwork = getRandomChoice(['visa', 'mastercard', 'rupay']);

    // Error reason weights: insufficient_funds 38%, card_expired 15%, mandate_revoked 15%, card_blocked 15%, generic_decline 17%
    const errorReason = getRandomWeighted([
      { value: 'insufficient_funds', weight: 0.38 },
      { value: 'card_expired', weight: 0.15 },
      { value: 'mandate_revoked', weight: 0.15 },
      { value: 'card_blocked', weight: 0.15 },
      { value: 'generic_decline', weight: 0.17 }
    ]);

    // Derive error_source
    let errorSource = 'customer';
    if (errorReason === 'card_blocked') errorSource = 'bank';
    else if (errorReason === 'generic_decline') errorSource = 'network';

    const mandateStatus = errorReason === 'mandate_revoked' ? 'revoked' : 'active';
    const attemptNumber = getRandomInt(1, 3);
    const createdAt = new Date().toISOString();

    // 3. Insert transaction into Supabase (only existing schema columns)
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
      created_at: createdAt
    };

    const { data: insertedTxn, error: insertTxnErr } = await supabase
      .from('transactions')
      .insert([newTxnPayload])
      .select()
      .single();

    if (insertTxnErr || !insertedTxn) {
      return res.status(500).json({ error: `Failed to insert transaction: ${insertTxnErr?.message}` });
    }

    // 4. Decision Engine logic
    let predictedCategory = errorReason;
    let actionTaken = 'retry_now';
    let confidenceScore = 0.88;
    let reasoning = 'Standard transient retry scheduled.';

    if (errorReason === 'mandate_revoked') {
      actionTaken = 'no_action_respect_revoke';
      confidenceScore = 0.99;
      reasoning = 'Customer mandate revoked. Zero retries enforced for 100% compliance.';
    } else if (errorReason === 'card_expired') {
      actionTaken = 'prompt_update_card';
      confidenceScore = 0.92;
      reasoning = 'Card expired. Prompting customer for updated payment method details.';
    } else if (errorReason === 'card_blocked') {
      actionTaken = 'prompt_update_card';
      confidenceScore = 0.90;
      reasoning = 'Card blocked by issuing bank. Prompting customer for alternate method.';
    } else if (errorReason === 'insufficient_funds') {
      actionTaken = 'retry_delayed';
      confidenceScore = 0.96;
      const payday = customer.typical_failure_day_of_month || 1;
      reasoning = `Insufficient funds. Delaying retry to customer's payday window (around day ${payday} of month).`;
    } else if (errorReason === 'generic_decline') {
      actionTaken = 'retry_now';
      confidenceScore = 0.88;
      reasoning = 'Transient network decline. Retrying within 2 hours for fast recovery.';
    }

    // NPCI Rule: UPI attempt ceiling cap check
    if (method === 'upi' && attemptNumber >= 4) {
      actionTaken = 'stop_max_attempts_reached';
      confidenceScore = 0.99;
      reasoning = 'NPCI UPI 4-attempt hard cap reached. Halting further retries.';
    }

    // 5. Determine Outcome Simulation Roll
    let outcome = 'not_recovered';
    let recoveryProbability = 0;

    if (actionTaken === 'no_action_respect_revoke' || actionTaken === 'stop_max_attempts_reached') {
      recoveryProbability = 0;
    } else if (errorReason === 'insufficient_funds') {
      recoveryProbability = 0.70;
    } else if (errorReason === 'card_expired') {
      recoveryProbability = 0.55;
    } else if (errorReason === 'card_blocked') {
      recoveryProbability = 0.25;
    } else if (errorReason === 'generic_decline') {
      recoveryProbability = 0.85;
    }

    if (Math.random() <= recoveryProbability) {
      outcome = 'recovered';
    }

    // 6. Insert into recovery_actions table
    const newActionPayload = {
      transaction_id: insertedTxn.id,
      predicted_category: predictedCategory,
      action_taken: actionTaken,
      confidence_score: confidenceScore,
      reasoning,
      outcome,
      created_at: new Date(new Date(createdAt).getTime() + 60000).toISOString()
    };

    const { data: insertedAction, error: actionErr } = await supabase
      .from('recovery_actions')
      .insert([newActionPayload])
      .select()
      .single();

    if (actionErr || !insertedAction) {
      return res.status(500).json({ error: `Failed to record recovery action: ${actionErr?.message}` });
    }

    // Attach transaction relation & live demo tag for unified frontend feed object
    const fullActionResult = {
      ...insertedAction,
      is_live_demo: true,
      transactions: {
        ...insertedTxn,
        is_live_demo: true
      }
    };

    return res.status(200).json({
      success: true,
      data: {
        transaction: {
          ...insertedTxn,
          is_live_demo: true
        },
        customer_profile: {
          customer_id: customer.customer_id,
          total_past_failures: customer.total_past_failures || getRandomInt(1, 6),
          total_past_successes: customer.total_past_successes || getRandomInt(3, 12),
          typical_failure_day_of_month: customer.typical_failure_day_of_month || getRandomInt(1, 5)
        },
        recovery_action: fullActionResult,
        simulation_details: {
          diagnosed_cause: predictedCategory,
          action_taken: actionTaken,
          confidence_score: confidenceScore,
          reasoning,
          outcome,
          recovery_probability: recoveryProbability
        }
      }
    });
  } catch (err) {
    console.error('Error in simulateLivePayment:', err);
    return res.status(500).json({ error: err.message || 'Internal simulation error' });
  }
};
