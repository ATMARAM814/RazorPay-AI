import { supabase } from '../config/supabase.js';

// GET /api/recovery-actions — returns rows from recovery_actions joined with transactions (supports optional page & limit)
export const getAllRecoveryActions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);

    let query = supabase
      .from('recovery_actions')
      .select('*, transactions(method, error_reason, amount, status, customer_id)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (page && limit && page > 0 && limit > 0) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    } else {
      query = query.limit(10000);
    }

    const { data, count, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      data,
      total: count !== null ? count : (data ? data.length : 0),
      page: page || 1,
      limit: limit || (data ? data.length : 0)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/recovery-actions/category/:category — returns recovery actions filtered by predicted_category
export const getRecoveryActionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { data, error } = await supabase
      .from('recovery_actions')
      .select('*, transactions(method, error_reason, amount)')
      .eq('predicted_category', category);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/recovery-actions/:transactionId — returns recovery action for a specific transactionId
export const getRecoveryActionByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { data, error } = await supabase
      .from('recovery_actions')
      .select('*, transactions(method, error_reason, amount)')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: `Recovery action for transactionId '${transactionId}' not found` });
    }

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
