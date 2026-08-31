import { supabase } from '../config/supabase.js';

// GET /api/transactions — returns all rows, with optional query filters (status, method, error_reason)
export const getAllTransactions = async (req, res) => {
  try {
    const { status, method, error_reason } = req.query;
    let query = supabase.from('transactions').select('*');

    if (status) {
      query = query.eq('status', status);
    }
    if (method) {
      query = query.eq('method', method);
    }
    if (error_reason) {
      query = query.eq('error_reason', error_reason);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/transactions/failed — shortcut returning rows where status = 'failed'
export const getFailedTransactions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'failed');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/transactions/:id — returns a single transaction by id
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: `Transaction with id '${id}' not found` });
    }

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
