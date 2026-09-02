import { supabase } from '../config/supabase.js';

// GET /api/recovery-actions — returns rows from recovery_actions joined with transactions (supports optional page & limit)
export const getAllRecoveryActions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);

    if (page && limit && page > 0 && limit > 0) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, count, error } = await supabase
        .from('recovery_actions')
        .select('*, transactions(method, error_reason, amount, status, customer_id, attempt_number, created_at)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        data,
        total: count !== null ? count : (data ? data.length : 0),
        page,
        limit
      });
    } else {
      // Chunked fetch to bypass Supabase 1,000-row PostgREST REST API limit and retrieve 100% of all rows
      const chunkSize = 1000;
      let allRows = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('recovery_actions')
          .select('*, transactions(method, error_reason, amount, status, customer_id, attempt_number, created_at)')
          .order('created_at', { ascending: false })
          .range(from, from + chunkSize - 1);

        if (error || !data) {
          console.error('Error fetching recovery_actions chunk:', error);
          break;
        }

        allRows = allRows.concat(data);
        if (data.length < chunkSize) {
          hasMore = false;
        } else {
          from += chunkSize;
        }
      }

      return res.status(200).json({
        data: allRows,
        total: allRows.length,
        page: 1,
        limit: allRows.length
      });
    }
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
